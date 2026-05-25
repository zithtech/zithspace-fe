"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { TicketDetailDrawer } from "@/components/projects/drawer/TicketDetailDrawer";
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
import { ClientV2Service } from "@/services/clientV2Service";

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
  ContactsOutlined,
  FireFilled,
  StarFilled,
  SyncOutlined,
  ExperimentOutlined,
  SafetyCertificateFilled
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

const { Title, Text } = Typography;

function DashboardContent() {
  const { token } = theme.useToken();
  const { user } = useAuth();
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
  const [clientStats, setClientStats] = useState({ active: 0, total: 0 });

  const [todayAttendance, setTodayAttendance] = useState<any>(null);

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

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

    fetchTodayAttendance();
  }, [user]);

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
          if (getAverageWorkingHours && typeof getAverageWorkingHours.averageHours !== 'undefined') {
            const avg = getAverageWorkingHours.averageHours;
            if (typeof avg === 'number') {
              const h = Math.floor(avg);
              const m = Math.round((avg - h) * 60);
              setAverageWorkHours(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
            } else {
              setAverageWorkHours(avg);
            }
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
          const [leads, invoices, clients] = await Promise.all([
            LeadService.getAll(),
            InvoiceService.getInvoices({ limit: 5 }),
            ClientV2Service.getClients({ page: 1, limit: 1000 }),
          ]);
          setRecentLeads((leads as any).data || leads);
          setCreatedInvoices(invoices.data);
          const all = clients.data || [];
          const active = all.filter((c: any) => c.status === "Active").length;
          setClientStats({
            active,
            total: clients.pagination?.total ?? all.length,
          });
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
  const notStartedTickets = tickets.filter(
    (t) => t.status?.toLowerCase() === "not_started",
  ).length;
  const inTestingTickets = tickets.filter(
    (t) =>
      ["in_testing", "testing", "live_testing", "live testing"].includes(t.status?.toLowerCase()),
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
    subtle,
    chart,
  }: {
    eyebrow: string;
    value: React.ReactNode;
    trend?: string;
    trendTone?: "positive" | "neutral" | "warning";
    icon: React.ReactNode;
    accent: string;
    subtle?: string;
    chart?: React.ReactNode;
  }) => {
    const trendColors: Record<string, { bg: string; fg: string }> = {
      positive: { bg: "rgba(16,185,129,0.1)", fg: "#047857" },
      neutral: { bg: token.colorFillAlter, fg: token.colorTextSecondary },
      warning: { bg: "rgba(245,158,11,0.12)", fg: "#92400E" },
    };
    const tc = trendColors[trendTone];
    return (
      <div
        className="dash-stat-card"
        style={{ ["--dash-accent" as any]: accent }}
      >
        <div className="dash-stat-head">
          <div
            className="dash-stat-icon"
            style={{
              background: `${accent}1F`,
              color: accent,
              boxShadow: `inset 0 0 0 1px ${accent}26`,
            }}
          >
            {icon}
          </div>
          <Text className="dash-stat-label">{eyebrow}</Text>
          <div className="dash-stat-value-wrap">
            <span className="dash-stat-value">{value}</span>
            {trend && (
              <span
                className="dash-stat-trend"
                style={{ background: tc.bg, color: tc.fg }}
              >
                {trend}
              </span>
            )}
          </div>
        </div>
        {subtle && <Text className="dash-stat-subtle">{subtle}</Text>}
        {chart && <div className="dash-stat-chart">{chart}</div>}
        <span
          className="dash-stat-accent"
          style={{
            background: `linear-gradient(90deg, ${accent} 0%, transparent 80%)`,
          }}
        />
      </div>
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

          <div
            className="dash-switch"
            role="tablist"
            aria-label="Dashboard view"
          >
            {[
              {
                value: "me" as const,
                title: "Me",
                icon: <UserOutlined />,
                accent: "#7C3AED",
                accentLight: "#A78BFA",
              },
              {
                value: "freelancer" as const,
                title: "Freelancer",
                icon: <SolutionOutlined />,
                accent: "#F59E0B",
                accentLight: "#FBBF24",
              },
              {
                value: "organization" as const,
                title: "Organization",
                icon: <TeamOutlined />,
                accent: "#0EA5E9",
                accentLight: "#38BDF8",
              },
            ].map((opt) => {
              const isActive = activeSegment === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`dash-switch-item${isActive ? " is-active" : ""}`}
                  onClick={() => setActiveSegment(opt.value)}
                  style={
                    {
                      "--switch-grad": `linear-gradient(135deg, ${opt.accent}, ${opt.accentLight})`,
                      "--switch-glow": `${opt.accent}88`,
                      "--switch-icon-bg": `${opt.accent}14`,
                      "--switch-icon-fg": opt.accent,
                      "--switch-icon-border": `${opt.accent}33`,
                      "--cm-accent": opt.accent,
                    } as React.CSSProperties
                  }
                >
                  <span className="dash-switch-icon">{opt.icon}</span>
                  <span className="dash-switch-title">{opt.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── ME: SEGMENT ───────────────────────────────────────── */}
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
                    {(() => {
                      const submittedCount =
                        (todayUpdates.bod ? 1 : 0) + (todayUpdates.eod ? 1 : 0);
                      const accent = "#4F46E5";
                      return (
                        <KpiCard
                          eyebrow="Daily Updates"
                          value={`${submittedCount} / 2`}
                          icon={<ThunderboltFilled />}
                          accent={accent}
                          chart={
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
                                        style={{
                                          fontSize: 11,
                                          color: "#10B981",
                                        }}
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
                                        color: item.state
                                          ? "#10B981"
                                          : "#F59E0B",
                                      }}
                                    >
                                      {item.state ? "Submitted" : "Pending"}
                                    </Text>
                                  </div>
                                </div>
                              ))}
                            </div>
                          }
                        />
                      );
                    })()}
                  </Col>

                  {/* Avg Working Hours */}
                  <Col xs={24} sm={12} lg={6}>
                    {(() => {
                      const [hh = 0, mm = 0, ss = 0] = String(averageWorkHours || "0:0:0")
                        .split(":")
                        .map((n) => Number(n) || 0);
                      const hoursDecimal = hh + mm / 60 + ss / 3600;
                      const pct = Math.min(100, Math.round((hoursDecimal / 8) * 100));
                      const accent = "#0EA5E9";
                      return (
                        <KpiCard
                          eyebrow="Avg Hours"
                          value={averageWorkHours}
                          icon={<ClockCircleOutlined />}
                          accent={accent}
                          subtle={`Last 5 days · ${pct}% of 8h target`}
                          chart={
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                              }}
                            >
                              <div
                                style={{
                                  flex: 1,
                                  height: 6,
                                  background: `${accent}1F`,
                                  borderRadius: 999,
                                  overflow: "hidden",
                                }}
                              >
                                <span
                                  style={{
                                    display: "block",
                                    height: "100%",
                                    width: `${pct}%`,
                                    background: `linear-gradient(90deg, ${accent}, #38BDF8)`,
                                    borderRadius: 999,
                                    transition: "width .4s ease",
                                  }}
                                />
                              </div>
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: token.colorTextSecondary,
                                  fontVariantNumeric: "tabular-nums",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {pct}%
                              </span>
                            </div>
                          }
                        />
                      );
                    })()}
                  </Col>

                  {/* My Tickets */}
                  <Col xs={24} sm={12} lg={6}>
                    {(() => {
                      const closed = myTicketsStats.closed;
                      const totalT = myTicketsStats.total;
                      const open = Math.max(0, totalT - closed);
                      const pctDone = totalT > 0 ? Math.round((closed / totalT) * 100) : 0;
                      const accent = "#7C3AED";
                      return (
                        <KpiCard
                          eyebrow="My Tickets"
                          value={`${closed} / ${totalT}`}
                          icon={<TrophyOutlined />}
                          accent={accent}
                          subtle={
                            totalT > 0
                              ? `${pctDone}% completion · ${open} open`
                              : "No tickets assigned"
                          }
                          chart={
                            totalT > 0 ? (
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 6,
                                }}
                              >
                                <div
                                  style={{
                                    height: 6,
                                    borderRadius: 999,
                                    display: "flex",
                                    overflow: "hidden",
                                    border: `1px solid ${token.colorBorderSecondary}`,
                                    background: token.colorFillAlter,
                                  }}
                                >
                                  <Tooltip title={`Closed: ${closed}`}>
                                    <span
                                      style={{
                                        width: `${(closed / totalT) * 100}%`,
                                        background: accent,
                                        display: "block",
                                        height: "100%",
                                        transition: "width .4s ease",
                                      }}
                                    />
                                  </Tooltip>
                                  <Tooltip title={`Open: ${open}`}>
                                    <span
                                      style={{
                                        width: `${(open / totalT) * 100}%`,
                                        background: "#C4B5FD",
                                        display: "block",
                                        height: "100%",
                                        transition: "width .4s ease",
                                      }}
                                    />
                                  </Tooltip>
                                </div>
                                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 5,
                                      fontSize: 11,
                                      color: token.colorTextSecondary,
                                      fontWeight: 500,
                                    }}
                                  >
                                    <span
                                      style={{
                                        width: 7,
                                        height: 7,
                                        borderRadius: 2,
                                        background: accent,
                                      }}
                                    />
                                    {closed} closed
                                  </span>
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 5,
                                      fontSize: 11,
                                      color: token.colorTextSecondary,
                                      fontWeight: 500,
                                    }}
                                  >
                                    <span
                                      style={{
                                        width: 7,
                                        height: 7,
                                        borderRadius: 2,
                                        background: "#C4B5FD",
                                      }}
                                    />
                                    {open} open
                                  </span>
                                </div>
                              </div>
                            ) : null
                          }
                        />
                      );
                    })()}
                  </Col>

                  {/* Today's Attendance */}
                  <Col xs={24} sm={12} lg={6}>
                    {(() => {
                      const present = dashboardData.stats.attendance.present;
                      const total = dashboardData.stats.totalMembers;
                      const rate = dashboardData.stats.attendance.attendanceRate;
                      const absent = dashboardData.stats.attendance.absent;
                      const late = dashboardData.stats.attendance.late;
                      const accent = "#10B981";
                      return (
                        <KpiCard
                          eyebrow="Team Today"
                          value={`${present} / ${total}`}
                          icon={<TeamOutlined />}
                          accent={accent}
                          subtle={`${rate}% present · ${absent} absent · ${late} late`}
                          chart={
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                              }}
                            >
                              <div
                                style={{
                                  flex: 1,
                                  height: 6,
                                  background: `${accent}1F`,
                                  borderRadius: 999,
                                  overflow: "hidden",
                                }}
                              >
                                <span
                                  style={{
                                    display: "block",
                                    height: "100%",
                                    width: `${rate}%`,
                                    background: `linear-gradient(90deg, ${accent}, #34D399)`,
                                    borderRadius: 999,
                                    transition: "width .4s ease",
                                  }}
                                />
                              </div>
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: token.colorTextSecondary,
                                  fontVariantNumeric: "tabular-nums",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {rate}%
                              </span>
                            </div>
                          }
                        />
                      );
                    })()}
                  </Col>
                </Row>

                {/* ─── Main Grid ──────────────────────────────────── */}
                <Row gutter={[16, 16]}>
                  {/* Time Tracker */}
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

                  {/* Today's Meetings */}
                  <Col xs={24} lg={8}>
                    {(() => {
                      const accentTM = "#7C3AED";
                      const tmCount = todaysMeetings.length;
                      const liveTM = todaysMeetings.find((m: any) => {
                        const now = dayjs();
                        return (
                          dayjs(m.startTime).isBefore(now) &&
                          dayjs(m.endTime).isAfter(now)
                        );
                      });
                      const upcomingTM = todaysMeetings.filter((m: any) =>
                        dayjs(m.startTime).isAfter(dayjs()),
                      ).length;
                      return (
                        <Card
                          style={{ ...cardBase, height: 340, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}
                          styles={{ body: { padding: 0, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", zIndex: 1 } }}
                          title={
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                flexWrap: "wrap",
                                minWidth: 0,
                              }}
                            >
                              {sectionTitle(
                                <VideoCameraOutlined />,
                                "Today's Meetings",
                                accentTM,
                              )}
                              {tmCount > 0 && (
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    letterSpacing: "0.4px",
                                    color: accentTM,
                                    background: `${accentTM}14`,
                                    border: `1px solid ${accentTM}33`,
                                    padding: "2px 7px",
                                    borderRadius: 999,
                                    fontVariantNumeric: "tabular-nums",
                                  }}
                                >
                                  {tmCount} TODAY
                                </span>
                              )}
                              {liveTM && (
                                <Tooltip title="Live meeting in progress">
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 5,
                                      fontSize: 10,
                                      fontWeight: 700,
                                      letterSpacing: "0.4px",
                                      color: "#047857",
                                      background: "#ECFDF5",
                                      border: "1px solid #10B98133",
                                      padding: "2px 7px",
                                      borderRadius: 999,
                                    }}
                                  >
                                    <span
                                      style={{
                                        width: 5,
                                        height: 5,
                                        borderRadius: "50%",
                                        background: "#10B981",
                                        animation:
                                          "pulse-soft 2s infinite ease-in-out",
                                      }}
                                    />
                                    LIVE
                                  </span>
                                </Tooltip>
                              )}
                              {!liveTM && upcomingTM > 0 && (
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    letterSpacing: "0.4px",
                                    color: "#4F46E5",
                                    background: "rgba(79,70,229,0.10)",
                                    border: "1px solid rgba(79,70,229,0.25)",
                                    padding: "2px 7px",
                                    borderRadius: 999,
                                  }}
                                >
                                  {upcomingTM} UPCOMING
                                </span>
                              )}
                            </div>
                          }
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
                              position: "relative",
                              zIndex: 1,
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
                                    {ended.length > 0 && (
                                      <div
                                        style={{
                                          display: "flex",
                                          justifyContent: "flex-end",
                                          alignItems: "center",
                                          marginBottom: -4,
                                        }}
                                      >
                                        <Text
                                          style={{
                                            fontSize: 9.5,
                                            color: token.colorTextTertiary,
                                            fontWeight: 600,
                                            letterSpacing: "0.4px",
                                            textTransform: "uppercase",
                                          }}
                                        >
                                          {ended.length} done earlier
                                        </Text>
                                      </div>
                                    )}

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
                      );
                    })()}
                  </Col>
                  <Col xs={24} lg={8}>
                    {(() => {
                      const segments = [
                        { key: "done", label: "Done", value: completedTickets, color: "#10B981", icon: <CheckCircleFilled style={{ fontSize: 11 }} /> },
                        { key: "active", label: "Active", value: inProgressTickets, color: "#0EA5E9", icon: <SyncOutlined spin style={{ fontSize: 11 }} /> },
                        { key: "testing", label: "In Testing", value: inTestingTickets, color: "#F59E0B", icon: <ExperimentOutlined style={{ fontSize: 11 }} /> },
                        { key: "not_started", label: "Not Started", value: notStartedTickets, color: "#94A3B8", icon: <ClockCircleOutlined style={{ fontSize: 11 }} /> },
                      ];
                      const pct = (n: number) => totalTickets > 0 ? Math.round((n / totalTickets) * 100) : 0;
                      return (
                        <Card
                          style={{ ...cardBase, height: 340, overflow: "hidden" }}
                          styles={{ body: { padding: 0, height: "100%", display: "flex", flexDirection: "column" } }}
                          title={sectionTitle(<TrophyOutlined />, "My Tickets", "#7C3AED")}
                          extra={<Button type="link" size="small" onClick={() => router.push("/projects/select")} style={{ fontSize: 11 }}>View all</Button>}
                        >
                          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "8px 12px 10px" }}>
                            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10, marginBottom: 4 }}>
                              <div>
                                <Text style={{ fontSize: 10, fontWeight: 700, color: token.colorTextSecondary, letterSpacing: "0.6px", textTransform: "uppercase", display: "block" }}>Completion</Text>
                                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 0 }}>
                                  <span style={{ fontSize: 24, fontWeight: 700, lineHeight: 1, color: token.colorText, letterSpacing: "-0.5px", fontVariantNumeric: "tabular-nums", background: `linear-gradient(135deg, ${token.colorPrimary} 0%, #7C3AED 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
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
                            <div style={{ display: "flex", width: "100%", height: 5, borderRadius: 999, overflow: "hidden", background: token.colorFillAlter, border: `1px solid ${token.colorBorderSecondary}`, gap: 2, padding: 1, marginBottom: 6 }}>
                              {segments.filter((s) => s.value > 0).map((s) => (
                                <Tooltip key={s.key} title={`${s.label}: ${s.value} (${pct(s.value)}%)`}>
                                  <div style={{ flex: s.value, background: s.color, borderRadius: 999, minWidth: 4 }} />
                                </Tooltip>
                              ))}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                              {segments.map((s) => {
                                const segmentPct = pct(s.value);
                                return (
                                  <div
                                    key={s.key}
                                    style={{
                                      position: "relative",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      padding: "6px 12px",
                                      borderRadius: 10,
                                      background: token.colorFillAlter,
                                      border: `1px solid ${token.colorBorderSecondary}`,
                                      overflow: "hidden",
                                    }}
                                  >
                                    {/* Progress background */}
                                    <div
                                      aria-hidden
                                      style={{
                                        position: "absolute",
                                        left: 0,
                                        top: 0,
                                        bottom: 0,
                                        width: `${segmentPct}%`,
                                        background: `${s.color}0D`,
                                        transition: "width .6s cubic-bezier(0.4, 0, 0.2, 1)",
                                      }}
                                    />

                                    <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative", zIndex: 1 }}>
                                      <div
                                        style={{
                                          width: 26,
                                          height: 26,
                                          borderRadius: 8,
                                          background: `${s.color}14`,
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          border: `1px solid ${s.color}26`,
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: s.color,
                                            filter: `drop-shadow(0 0 4px ${s.color}40)`,
                                          }}
                                        >
                                          {s.icon}
                                        </div>
                                      </div>
                                      <div style={{ display: "flex", flexDirection: "column" }}>
                                        <Text style={{ fontSize: 12, fontWeight: 700, color: token.colorText, lineHeight: 1.1 }}>{s.label}</Text>
                                        <Text style={{ fontSize: 8, fontWeight: 600, color: token.colorTextTertiary, textTransform: "uppercase", letterSpacing: "0.3px" }}>Tasks</Text>
                                      </div>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "baseline", gap: 6, position: "relative", zIndex: 1 }}>
                                      <span style={{ fontSize: 16, fontWeight: 800, color: token.colorText, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{s.value}</span>
                                      <span style={{ fontSize: 10, color: token.colorTextTertiary, fontWeight: 700, fontVariantNumeric: "tabular-nums", minWidth: 32, textAlign: "right" }}>{segmentPct}%</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </Card>
                      );
                    })()}
                  </Col>
                </Row>

                {/* Bottom Row: Recent Tickets + Quick Actions */}
                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                  <Col xs={24} lg={16}>
                    {(() => {
                      const accent = "#0EA5E9";
                      const testingCount = recentTickets.filter((t: any) => {
                        const s = t.status?.toLowerCase();
                        return s === "in_testing" || s === "testing" || s === "live_testing" || s === "live testing";
                      }).length;
                      const activeCount = recentTickets.filter((t: any) => {
                        const s = t.status?.toLowerCase();
                        return s === "in_progress" || s === "doing";
                      }).length;
                      const notStartedCount = recentTickets.filter((t: any) => {
                        const s = t.status?.toLowerCase();
                        return s === "not_started";
                      }).length;
                      return (
                        <Card
                          style={{
                            ...cardBase,
                            height: "100%",
                            position: "relative",
                            overflow: "hidden",
                          }}
                          styles={{
                            body: {
                              padding: 16,
                              display: "flex",
                              flexDirection: "column",
                              position: "relative",
                              zIndex: 1,
                            },
                          }}
                          title={
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                flexWrap: "wrap",
                                minWidth: 0,
                              }}
                            >
                              {sectionTitle(
                                <FileTextOutlined />,
                                "Recent Tickets",
                                accent,
                              )}
                              {recentTickets.length > 0 && (
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    letterSpacing: "0.4px",
                                    color: accent,
                                    background: `${accent}14`,
                                    border: `1px solid ${accent}33`,
                                    padding: "2px 7px",
                                    borderRadius: 999,
                                    fontVariantNumeric: "tabular-nums",
                                  }}
                                >
                                  {recentTickets.length} TOTAL
                                </span>
                              )}
                              {activeCount > 0 && (
                                <Tooltip title={`${activeCount} in progress`}>
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 5,
                                      fontSize: 10,
                                      fontWeight: 700,
                                      letterSpacing: "0.3px",
                                      color: "#0EA5E9",
                                      background: "#F0F9FF",
                                      border: "1px solid #0EA5E933",
                                      padding: "2px 7px",
                                      borderRadius: 999,
                                    }}
                                  >
                                    <span
                                      style={{
                                        width: 5,
                                        height: 5,
                                        borderRadius: "50%",
                                        background: "#0EA5E9",
                                        boxShadow: "0 0 6px #0EA5E980",
                                        animation:
                                          "pulse-soft 2s infinite ease-in-out",
                                      }}
                                    />
                                    {activeCount} ACTIVE
                                  </span>
                                </Tooltip>
                              )}
                              {testingCount > 0 && (
                                <Tooltip title={`${testingCount} in testing`}>
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 5,
                                      fontSize: 10,
                                      fontWeight: 700,
                                      letterSpacing: "0.3px",
                                      color: "#F59E0B",
                                      background: "#FFFBEB",
                                      border: "1px solid #F59E0B33",
                                      padding: "2px 7px",
                                      borderRadius: 999,
                                    }}
                                  >
                                    <span
                                      style={{
                                        width: 5,
                                        height: 5,
                                        borderRadius: "50%",
                                        background: "#F59E0B",
                                      }}
                                    />
                                    {testingCount} TESTING
                                  </span>
                                </Tooltip>
                              )}
                              {notStartedCount > 0 && (
                                <Tooltip title={`${notStartedCount} not started`}>
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 5,
                                      fontSize: 10,
                                      fontWeight: 700,
                                      letterSpacing: "0.3px",
                                      color: "#94A3B8",
                                      background: token.colorFillAlter,
                                      border: `1px solid ${token.colorBorderSecondary}`,
                                      padding: "2px 7px",
                                      borderRadius: 999,
                                    }}
                                  >
                                    <span
                                      style={{
                                        width: 5,
                                        height: 5,
                                        borderRadius: "50%",
                                        background: "#94A3B8",
                                      }}
                                    />
                                    {notStartedCount} NOT STARTED
                                  </span>
                                </Tooltip>
                              )}
                            </div>
                          }
                          extra={
                            <Button
                              type="link"
                              size="small"
                              onClick={() => router.push("/projects/select")}
                              style={{ fontSize: 11, fontWeight: 600 }}
                            >
                              View all{" "}
                              <ArrowRightOutlined style={{ fontSize: 10 }} />
                            </Button>
                          }
                        >

                          {recentTickets.length === 0 ? (
                            <div
                              style={{
                                padding: 40,
                                textAlign: "center",
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 10,
                              }}
                            >
                              <div
                                style={{
                                  width: 52,
                                  height: 52,
                                  borderRadius: 16,
                                  background: `${accent}14`,
                                  border: `1px solid ${accent}33`,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: accent,
                                  fontSize: 22,
                                }}
                              >
                                <FileTextOutlined />
                              </div>
                              <Text
                                strong
                                style={{
                                  fontSize: 13,
                                  color: token.colorText,
                                }}
                              >
                                No tickets yet
                              </Text>
                              <Text
                                type="secondary"
                                style={{ fontSize: 11 }}
                              >
                                Recent assignments will appear here
                              </Text>
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
                                  in_testing: { label: "In Testing", color: "#F59E0B", bg: "#FFFBEB" },
                                  testing: { label: "In Testing", color: "#F59E0B", bg: "#FFFBEB" },
                                  live_testing: { label: "In Testing", color: "#F59E0B", bg: "#FFFBEB" },
                                  "live testing": { label: "In Testing", color: "#F59E0B", bg: "#FFFBEB" },
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

                                const isLive =
                                  status === "in_progress" ||
                                  status === "doing";
                                return (
                                  <div
                                    key={item.id}
                                    onClick={() =>
                                      setSelectedTicketId(item.id)
                                    }
                                    className="dash-rt-card"
                                    style={
                                      {
                                        position: "relative",
                                        cursor: "pointer",
                                        borderRadius: 14,
                                        border: `1px solid ${token.colorBorderSecondary}`,
                                        background: `linear-gradient(135deg, ${sm.color}08 0%, ${token.colorBgContainer} 70%)`,
                                        padding: "14px 14px 12px 18px",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 10,
                                        overflow: "hidden",
                                        ["--rt-glow" as any]: `${sm.color}55`,
                                        ["--rt-border" as any]: `${sm.color}55`,
                                      } as React.CSSProperties
                                    }
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
                                        boxShadow: `0 0 12px ${priorityColor}80`,
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
                                            animation: isLive
                                              ? "pulse-soft 2s infinite ease-in-out"
                                              : undefined,
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
                      );
                    })()}
                  </Col>

                  <Col xs={24} lg={8}>
                    {(() => {
                      const accentQA = "#F59E0B";
                      const quickActions = [
                        {
                          icon: <PlusCircleOutlined />,
                          title: "Create Ticket",
                          desc: "Log a new task or issue",
                          accent: "#7C3AED",
                          onClick: () => router.push("/projects/create"),
                          shortcut: "T",
                        },
                        {
                          icon: <FolderOpenOutlined />,
                          title: "Document Hub",
                          desc: "Browse and manage docs",
                          accent: "#10B981",
                          onClick: () => router.push("/documenthub"),
                          shortcut: "D",
                        },
                        {
                          icon: <AppstoreOutlined />,
                          title: "Project",
                          desc: "Manage and track all projects",
                          accent: "#0EA5E9",
                          onClick: () => router.push("/projects/manage"),
                          shortcut: "P",
                        },
                      ];
                      return (
                        <Card
                          style={{
                            ...cardBase,
                            height: "100%",
                            position: "relative",
                            overflow: "hidden",
                          }}
                          styles={{
                            body: {
                              padding: 16,
                              position: "relative",
                              zIndex: 1,
                            },
                          }}
                          title={
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                minWidth: 0,
                              }}
                            >
                              {sectionTitle(
                                <ThunderboltFilled />,
                                "Quick Actions",
                                accentQA,
                              )}
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  letterSpacing: "0.4px",
                                  color: accentQA,
                                  background: `${accentQA}14`,
                                  border: `1px solid ${accentQA}33`,
                                  padding: "2px 7px",
                                  borderRadius: 999,
                                }}
                              >
                                SHORTCUTS
                              </span>
                            </div>
                          }
                        >

                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 8,
                            }}
                          >
                            {quickActions.map((a) => (
                              <div
                                key={a.title}
                                onClick={a.onClick}
                                className="dash-qa-row"
                                style={
                                  {
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    padding: "10px 12px 10px 14px",
                                    borderRadius: 12,
                                    border: `1px solid ${token.colorBorderSecondary}`,
                                    background: `linear-gradient(135deg, ${a.accent}0A 0%, ${token.colorBgContainer} 70%)`,
                                    position: "relative",
                                    overflow: "hidden",
                                    ["--qa-accent" as any]: a.accent,
                                  } as React.CSSProperties
                                }
                              >
                                <span
                                  aria-hidden
                                  style={{
                                    position: "absolute",
                                    left: 0,
                                    top: 0,
                                    bottom: 0,
                                    width: 3,
                                    background: a.accent,
                                  }}
                                />
                                <div
                                  style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 10,
                                    background: `${a.accent}14`,
                                    border: `1px solid ${a.accent}33`,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: a.accent,
                                    fontSize: 16,
                                    flexShrink: 0,
                                  }}
                                >
                                  {a.icon}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <Text
                                    strong
                                    style={{
                                      fontSize: 13,
                                      color: token.colorText,
                                      display: "block",
                                      lineHeight: 1.3,
                                      letterSpacing: "-0.1px",
                                    }}
                                  >
                                    {a.title}
                                  </Text>
                                  <Text
                                    type="secondary"
                                    style={{
                                      fontSize: 11,
                                      lineHeight: 1.3,
                                    }}
                                  >
                                    {a.desc}
                                  </Text>
                                </div>
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: token.colorTextTertiary,
                                    background: token.colorFillAlter,
                                    border: `1px solid ${token.colorBorderSecondary}`,
                                    padding: "2px 6px",
                                    borderRadius: 6,
                                    fontVariantNumeric: "tabular-nums",
                                    letterSpacing: "0.4px",
                                    flexShrink: 0,
                                  }}
                                >
                                  ⌘ {a.shortcut}
                                </span>
                                <ArrowRightOutlined
                                  style={{
                                    fontSize: 11,
                                    color: token.colorTextTertiary,
                                    flexShrink: 0,
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </Card>
                      );
                    })()}
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
                    {(() => {
                      const closed = myTicketsStats.closed;
                      const totalT = myTicketsStats.total;
                      const open = Math.max(0, totalT - closed);
                      const pctDone = totalT > 0 ? Math.round((closed / totalT) * 100) : 0;
                      const accent = "#7C3AED";
                      return (
                        <KpiCard
                          eyebrow="My Tickets"
                          value={`${closed} / ${totalT}`}
                          icon={<TrophyOutlined />}
                          accent={accent}
                          subtle={
                            totalT > 0
                              ? `${pctDone}% completion · ${open} open`
                              : "No tickets assigned"
                          }
                          chart={
                            totalT > 0 ? (
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 6,
                                }}
                              >
                                <div
                                  style={{
                                    height: 6,
                                    borderRadius: 999,
                                    display: "flex",
                                    overflow: "hidden",
                                    border: `1px solid ${token.colorBorderSecondary}`,
                                    background: token.colorFillAlter,
                                  }}
                                >
                                  <span
                                    style={{
                                      width: `${(closed / totalT) * 100}%`,
                                      background: accent,
                                      display: "block",
                                      height: "100%",
                                      transition: "width .4s ease",
                                    }}
                                  />
                                  <span
                                    style={{
                                      width: `${(open / totalT) * 100}%`,
                                      background: "#C4B5FD",
                                      display: "block",
                                      height: "100%",
                                      transition: "width .4s ease",
                                    }}
                                  />
                                </div>
                                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 5,
                                      fontSize: 11,
                                      color: token.colorTextSecondary,
                                      fontWeight: 500,
                                    }}
                                  >
                                    <span
                                      style={{
                                        width: 7,
                                        height: 7,
                                        borderRadius: 2,
                                        background: accent,
                                      }}
                                    />
                                    {closed} closed
                                  </span>
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 5,
                                      fontSize: 11,
                                      color: token.colorTextSecondary,
                                      fontWeight: 500,
                                    }}
                                  >
                                    <span
                                      style={{
                                        width: 7,
                                        height: 7,
                                        borderRadius: 2,
                                        background: "#C4B5FD",
                                      }}
                                    />
                                    {open} open
                                  </span>
                                </div>
                              </div>
                            ) : null
                          }
                        />
                      );
                    })()}
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    {(() => {
                      const accent = "#F59E0B";
                      const count = recentLeads.length;
                      const pct = Math.min(100, count * 10);
                      return (
                        <KpiCard
                          eyebrow="Recent Leads"
                          value={count}
                          icon={<RocketOutlined />}
                          accent={accent}
                          subtle={
                            count > 0
                              ? `${pct}% of pipeline capacity`
                              : "No leads yet"
                          }
                          chart={
                            count > 0 ? (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                }}
                              >
                                <div
                                  style={{
                                    flex: 1,
                                    height: 6,
                                    background: `${accent}1F`,
                                    borderRadius: 999,
                                    overflow: "hidden",
                                  }}
                                >
                                  <span
                                    style={{
                                      display: "block",
                                      height: "100%",
                                      width: `${pct}%`,
                                      background: `linear-gradient(90deg, ${accent}, #FBBF24)`,
                                      borderRadius: 999,
                                      transition: "width .4s ease",
                                    }}
                                  />
                                </div>
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: token.colorTextSecondary,
                                    fontVariantNumeric: "tabular-nums",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {pct}%
                                </span>
                              </div>
                            ) : null
                          }
                        />
                      );
                    })()}
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    {(() => {
                      const activeC = clientStats.active;
                      const totalC = clientStats.total;
                      const inactiveC = Math.max(0, totalC - activeC);
                      const pctActive =
                        totalC > 0 ? Math.round((activeC / totalC) * 100) : 0;
                      const accent = "#10B981";
                      return (
                        <KpiCard
                          eyebrow="Clients"
                          value={`${activeC} / ${totalC}`}
                          icon={<ContactsOutlined />}
                          accent={accent}
                          subtle={
                            totalC > 0
                              ? `${pctActive}% active · ${inactiveC} inactive`
                              : "No clients yet"
                          }
                          chart={
                            totalC > 0 ? (
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 6,
                                }}
                              >
                                <div
                                  style={{
                                    height: 6,
                                    borderRadius: 999,
                                    display: "flex",
                                    overflow: "hidden",
                                    border: `1px solid ${token.colorBorderSecondary}`,
                                    background: token.colorFillAlter,
                                  }}
                                >
                                  <span
                                    style={{
                                      width: `${(activeC / totalC) * 100}%`,
                                      background: accent,
                                      display: "block",
                                      height: "100%",
                                      transition: "width .4s ease",
                                    }}
                                  />
                                  <span
                                    style={{
                                      width: `${(inactiveC / totalC) * 100}%`,
                                      background: "#A7F3D0",
                                      display: "block",
                                      height: "100%",
                                      transition: "width .4s ease",
                                    }}
                                  />
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 12,
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 5,
                                      fontSize: 11,
                                      color: token.colorTextSecondary,
                                      fontWeight: 500,
                                    }}
                                  >
                                    <span
                                      style={{
                                        width: 7,
                                        height: 7,
                                        borderRadius: 2,
                                        background: accent,
                                      }}
                                    />
                                    {activeC} active
                                  </span>
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 5,
                                      fontSize: 11,
                                      color: token.colorTextSecondary,
                                      fontWeight: 500,
                                    }}
                                  >
                                    <span
                                      style={{
                                        width: 7,
                                        height: 7,
                                        borderRadius: 2,
                                        background: "#A7F3D0",
                                      }}
                                    />
                                    {inactiveC} inactive
                                  </span>
                                </div>
                              </div>
                            ) : null
                          }
                        />
                      );
                    })()}
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    {(() => {
                      const active = dashboardData?.stats.activeProjects || 0;
                      const growth = dashboardData?.trends.projectGrowth || "0%";
                      const accent = "#0EA5E9";
                      return (
                        <KpiCard
                          eyebrow="Active Projects"
                          value={active}
                          icon={<AppstoreOutlined />}
                          accent={accent}
                          subtle={`Growth ${growth} this period`}
                          chart={
                            active > 0 ? (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                }}
                              >
                                <div
                                  style={{
                                    flex: 1,
                                    height: 6,
                                    background: `${accent}1F`,
                                    borderRadius: 999,
                                    overflow: "hidden",
                                  }}
                                >
                                  <span
                                    style={{
                                      display: "block",
                                      height: "100%",
                                      width: `${Math.min(100, active * 12)}%`,
                                      background: `linear-gradient(90deg, ${accent}, #38BDF8)`,
                                      borderRadius: 999,
                                      transition: "width .4s ease",
                                    }}
                                  />
                                </div>
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: token.colorTextSecondary,
                                    fontVariantNumeric: "tabular-nums",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {active} live
                                </span>
                              </div>
                            ) : null
                          }
                        />
                      );
                    })()}
                  </Col>
                </Row>

                {/* ─── Main Grid ──────────────────────────────────── */}
                <Row gutter={[16, 16]}>
                  {/* My Tickets Stats */}
                  <Col xs={24} lg={8}>
                    {(() => {
                      const segments = [
                        { key: "done", label: "Done", value: completedTickets, color: "#10B981", icon: <CheckCircleFilled style={{ fontSize: 11 }} /> },
                        { key: "active", label: "Active", value: inProgressTickets, color: "#0EA5E9", icon: <SyncOutlined spin style={{ fontSize: 11 }} /> },
                        { key: "testing", label: "In Testing", value: inTestingTickets, color: "#F59E0B", icon: <ExperimentOutlined style={{ fontSize: 11 }} /> },
                        { key: "not_started", label: "Not Started", value: notStartedTickets, color: "#94A3B8", icon: <ClockCircleOutlined style={{ fontSize: 11 }} /> },
                      ];
                      const pct = (n: number) => totalTickets > 0 ? Math.round((n / totalTickets) * 100) : 0;
                      return (
                        <Card
                          style={{ ...cardBase, height: 340, overflow: "hidden" }}
                          styles={{ body: { padding: 0, height: "100%", display: "flex", flexDirection: "column" } }}
                          title={sectionTitle(<TrophyOutlined />, "My Tickets", "#7C3AED")}
                          extra={<Button type="link" size="small" onClick={() => router.push("/projects/select")} style={{ fontSize: 11 }}>View all</Button>}
                        >
                          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "8px 12px 10px" }}>
                            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10, marginBottom: 4 }}>
                              <div>
                                <Text style={{ fontSize: 10, fontWeight: 700, color: token.colorTextSecondary, letterSpacing: "0.6px", textTransform: "uppercase", display: "block" }}>Completion</Text>
                                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 0 }}>
                                  <span style={{ fontSize: 24, fontWeight: 700, lineHeight: 1, color: token.colorText, letterSpacing: "-0.5px", fontVariantNumeric: "tabular-nums", background: `linear-gradient(135deg, ${token.colorPrimary} 0%, #7C3AED 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
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
                            <div style={{ display: "flex", width: "100%", height: 5, borderRadius: 999, overflow: "hidden", background: token.colorFillAlter, border: `1px solid ${token.colorBorderSecondary}`, gap: 2, padding: 1, marginBottom: 6 }}>
                              {segments.filter((s) => s.value > 0).map((s) => (
                                <Tooltip key={s.key} title={`${s.label}: ${s.value} (${pct(s.value)}%)`}>
                                  <div style={{ flex: s.value, background: s.color, borderRadius: 999, minWidth: 4 }} />
                                </Tooltip>
                              ))}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                              {segments.map((s) => {
                                const segmentPct = pct(s.value);
                                return (
                                  <div
                                    key={s.key}
                                    style={{
                                      position: "relative",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      padding: "6px 12px",
                                      borderRadius: 10,
                                      background: token.colorFillAlter,
                                      border: `1px solid ${token.colorBorderSecondary}`,
                                      overflow: "hidden",
                                    }}
                                  >
                                    {/* Progress background */}
                                    <div
                                      aria-hidden
                                      style={{
                                        position: "absolute",
                                        left: 0,
                                        top: 0,
                                        bottom: 0,
                                        width: `${segmentPct}%`,
                                        background: `${s.color}0D`,
                                        transition: "width .6s cubic-bezier(0.4, 0, 0.2, 1)",
                                      }}
                                    />

                                    <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative", zIndex: 1 }}>
                                      <div
                                        style={{
                                          width: 26,
                                          height: 26,
                                          borderRadius: 8,
                                          background: `${s.color}14`,
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          border: `1px solid ${s.color}26`,
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: s.color,
                                            filter: `drop-shadow(0 0 4px ${s.color}40)`,
                                          }}
                                        >
                                          {s.icon}
                                        </div>
                                      </div>
                                      <div style={{ display: "flex", flexDirection: "column" }}>
                                        <Text style={{ fontSize: 12, fontWeight: 700, color: token.colorText, lineHeight: 1.1 }}>{s.label}</Text>
                                        <Text style={{ fontSize: 8, fontWeight: 600, color: token.colorTextTertiary, textTransform: "uppercase", letterSpacing: "0.3px" }}>Tasks</Text>
                                      </div>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "baseline", gap: 6, position: "relative", zIndex: 1 }}>
                                      <span style={{ fontSize: 16, fontWeight: 800, color: token.colorText, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{s.value}</span>
                                      <span style={{ fontSize: 10, color: token.colorTextTertiary, fontWeight: 700, fontVariantNumeric: "tabular-nums", minWidth: 32, textAlign: "right" }}>{segmentPct}%</span>
                                    </div>
                                  </div>
                                );
                              })}
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
                    {(() => {
                      const accent = "#0EA5E9";
                      const list = recentTickets.slice(0, 5);
                      const activeCount = recentTickets.filter((t: any) => {
                        const s = t.status?.toLowerCase();
                        return s === "in_progress" || s === "doing";
                      }).length;
                      const testingCount = recentTickets.filter((t: any) => {
                        const s = t.status?.toLowerCase();
                        return s === "in_testing" || s === "testing" || s === "live_testing" || s === "live testing";
                      }).length;
                      const notStartedCount = recentTickets.filter((t: any) => {
                        const s = t.status?.toLowerCase();
                        return s === "not_started";
                      }).length;
                      return (
                        <Card
                          style={{
                            ...cardBase,
                            height: 340,
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden",
                            position: "relative",
                          }}
                          styles={{
                            body: {
                              padding: 0,
                              flex: 1,
                              display: "flex",
                              flexDirection: "column",
                              overflow: "hidden",
                            },
                          }}
                          title={
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                minWidth: 0,
                              }}
                            >
                              {sectionTitle(
                                <FileTextOutlined />,
                                "Recent Tickets",
                                accent,
                              )}
                            </div>
                          }
                          extra={
                            <Button
                              type="link"
                              size="small"
                              onClick={() => router.push("/projects/select")}
                              style={{ fontSize: 11, fontWeight: 600 }}
                            >
                              View all <ArrowRightOutlined style={{ fontSize: 10 }} />
                            </Button>
                          }
                        >

                          <div
                            style={{
                              flex: 1,
                              overflowY: "auto",
                              padding: 12,
                              position: "relative",
                              zIndex: 1,
                            }}
                            className="no-scrollbar"
                          >
                            {list.length > 0 ? (
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 8,
                                }}
                              >
                                {list.map((item: any) => {
                                  const status = item.status?.toLowerCase();
                                  const statusMeta: Record<
                                    string,
                                    { label: string; color: string; bg: string }
                                  > = {
                                    completed: {
                                      label: "Completed",
                                      color: "#10B981",
                                      bg: "#ECFDF5",
                                    },
                                    live: {
                                      label: "Live",
                                      color: "#10B981",
                                      bg: "#ECFDF5",
                                    },
                                    done: {
                                      label: "Done",
                                      color: "#10B981",
                                      bg: "#ECFDF5",
                                    },
                                    in_progress: {
                                      label: "In Progress",
                                      color: "#0EA5E9",
                                      bg: "#F0F9FF",
                                    },
                                    doing: {
                                      label: "In Progress",
                                      color: "#0EA5E9",
                                      bg: "#F0F9FF",
                                    },
                                    in_testing: {
                                      label: "In Testing",
                                      color: "#F59E0B",
                                      bg: "#FFFBEB",
                                    },
                                    testing: {
                                      label: "In Testing",
                                      color: "#F59E0B",
                                      bg: "#FFFBEB",
                                    },
                                    live_testing: {
                                      label: "In Testing",
                                      color: "#F59E0B",
                                      bg: "#FFFBEB",
                                    },
                                    "live testing": {
                                      label: "In Testing",
                                      color: "#F59E0B",
                                      bg: "#FFFBEB",
                                    },
                                    not_started: {
                                      label: "Not Started",
                                      color: "#94A3B8",
                                      bg: token.colorFillAlter,
                                    },
                                  };
                                  const sm =
                                    statusMeta[status] || {
                                      label: (item.status || "—")
                                        .replace(/_/g, " ")
                                        .toUpperCase(),
                                      color: token.colorTextSecondary,
                                      bg: token.colorFillAlter,
                                    };
                                  const priorityColor = getPriorityColor(
                                    item.priority,
                                  );
                                  const priority = (item.priority || "")
                                    .toString()
                                    .toUpperCase();
                                  const projectLabel =
                                    typeof item.project === "string"
                                      ? item.project
                                      : item.project?.code ||
                                      item.project?.name ||
                                      "";

                                  return (
                                    <div
                                      key={item.id}
                                      onClick={() =>
                                        setSelectedTicketId(item.id)
                                      }
                                      className="ticket-list-item"
                                      style={{
                                        position: "relative",
                                        cursor: "pointer",
                                        borderRadius: 12,
                                        border: `1px solid ${token.colorBorderSecondary}`,
                                        background: token.colorBgContainer,
                                        padding: "10px 12px 10px 16px",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 6,
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
                                          width: 3,
                                          background: priorityColor,
                                        }}
                                      />

                                      {/* Top row */}
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
                                              fontSize: 9.5,
                                              fontWeight: 700,
                                              letterSpacing: "0.3px",
                                              color: token.colorTextSecondary,
                                              background: token.colorFillAlter,
                                              border: `1px solid ${token.colorBorderSecondary}`,
                                              padding: "2px 6px",
                                              borderRadius: 6,
                                              fontVariantNumeric: "tabular-nums",
                                            }}
                                          >
                                            {item.ticketNumber || item.ticketId}
                                          </span>
                                          {projectLabel && (
                                            <span
                                              style={{
                                                fontSize: 10,
                                                fontWeight: 600,
                                                color: token.colorTextTertiary,
                                                maxWidth: 80,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                              }}
                                            >
                                              · {projectLabel}
                                            </span>
                                          )}
                                        </Space>
                                        <span
                                          style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 5,
                                            fontSize: 9,
                                            fontWeight: 700,
                                            letterSpacing: "0.3px",
                                            color: sm.color,
                                            background: sm.bg,
                                            padding: "2px 7px",
                                            borderRadius: 999,
                                            border: `1px solid ${sm.color}26`,
                                          }}
                                        >
                                          <span
                                            style={{
                                              width: 4,
                                              height: 4,
                                              borderRadius: "50%",
                                              background: sm.color,
                                              boxShadow: `0 0 5px ${sm.color}80`,
                                            }}
                                          />
                                          {sm.label.toUpperCase()}
                                        </span>
                                      </div>

                                      {/* Title */}
                                      <Tooltip title={item.title}>
                                        <div
                                          style={{
                                            fontSize: 12.5,
                                            fontWeight: 600,
                                            color: token.colorText,
                                            lineHeight: 1.35,
                                            letterSpacing: "-0.1px",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
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
                                        }}
                                      >
                                        {priority ? (
                                          <Tooltip
                                            title={`Priority: ${priority}`}
                                          >
                                            <span
                                              style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: 4,
                                                fontSize: 9,
                                                fontWeight: 700,
                                                letterSpacing: "0.3px",
                                                color: priorityColor,
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
                                        ) : (
                                          <span />
                                        )}
                                        <Space size={6} align="center">
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
                                                size={18}
                                                src={item.assignee.avatar}
                                                style={{
                                                  backgroundColor: "#7C3AED",
                                                  fontSize: 9,
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
                            ) : (
                              <div
                                style={{
                                  textAlign: "center",
                                  padding: "32px 16px",
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  gap: 10,
                                }}
                              >
                                <div
                                  style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 14,
                                    background: `${accent}14`,
                                    border: `1px solid ${accent}33`,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: accent,
                                    fontSize: 20,
                                  }}
                                >
                                  <FileTextOutlined />
                                </div>
                                <div>
                                  <Text
                                    strong
                                    style={{
                                      fontSize: 13,
                                      color: token.colorText,
                                      display: "block",
                                    }}
                                  >
                                    No tickets yet
                                  </Text>
                                  <Text
                                    type="secondary"
                                    style={{ fontSize: 11 }}
                                  >
                                    Recent assignments will appear here
                                  </Text>
                                </div>
                              </div>
                            )}
                          </div>
                        </Card>
                      );
                    })()}
                  </Col>

                  {/* Recent Leads */}
                  <Col xs={24} lg={12}>
                    {(() => {
                      const accent = "#F59E0B";
                      const list = recentLeads.slice(0, 5);
                      const wonCount = recentLeads.filter(
                        (l: any) => l.status?.toLowerCase() === "won",
                      ).length;
                      const hotCount = recentLeads.filter(
                        (l: any) => (l.ai_score ?? 0) >= 80,
                      ).length;

                      const statusMeta: Record<
                        string,
                        { label: string; color: string; bg: string }
                      > = {
                        won: { label: "Won", color: "#10B981", bg: "#ECFDF5" },
                        lost: { label: "Lost", color: "#EF4444", bg: "#FEF2F2" },
                        open: { label: "Open", color: "#F59E0B", bg: "#FFFBEB" },
                        new: { label: "New", color: "#F59E0B", bg: "#FFFBEB" },
                        qualified: {
                          label: "Qualified",
                          color: "#0EA5E9",
                          bg: "#F0F9FF",
                        },
                        contacted: {
                          label: "Contacted",
                          color: "#7C3AED",
                          bg: "#F5F3FF",
                        },
                        proposal_sent: {
                          label: "Proposal Sent",
                          color: "#3B82F6",
                          bg: "#EFF6FF",
                        },
                        submitted: {
                          label: "Submitted",
                          color: "#3B82F6",
                          bg: "#EFF6FF",
                        },
                      };

                      return (
                        <Card
                          style={{
                            ...cardBase,
                            height: 340,
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden",
                            position: "relative",
                          }}
                          styles={{
                            body: {
                              padding: 0,
                              flex: 1,
                              display: "flex",
                              flexDirection: "column",
                              overflow: "hidden",
                            },
                          }}
                          title={
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                flexWrap: "wrap",
                                minWidth: 0,
                              }}
                            >
                              {sectionTitle(
                                <RocketOutlined />,
                                "Recent Leads",
                                accent,
                              )}
                              {recentLeads.length > 0 && (
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    letterSpacing: "0.4px",
                                    color: accent,
                                    background: `${accent}14`,
                                    border: `1px solid ${accent}33`,
                                    padding: "2px 7px",
                                    borderRadius: 999,
                                    fontVariantNumeric: "tabular-nums",
                                  }}
                                >
                                  {recentLeads.length} TOTAL
                                </span>
                              )}
                              {wonCount > 0 && (
                                <Tooltip title={`${wonCount} won`}>
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 5,
                                      fontSize: 10,
                                      fontWeight: 700,
                                      letterSpacing: "0.4px",
                                      color: "#10B981",
                                      background: "#ECFDF5",
                                      border: "1px solid #10B98133",
                                      padding: "2px 7px",
                                      borderRadius: 999,
                                    }}
                                  >
                                    <span
                                      style={{
                                        width: 5,
                                        height: 5,
                                        borderRadius: "50%",
                                        background: "#10B981",
                                        boxShadow: "0 0 6px #10B98180",
                                      }}
                                    />
                                    {wonCount} WON
                                  </span>
                                </Tooltip>
                              )}
                              {hotCount > 0 && (
                                <Tooltip title={`${hotCount} high-score leads`}>
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 4,
                                      fontSize: 10,
                                      fontWeight: 700,
                                      letterSpacing: "0.4px",
                                      color: "#EF4444",
                                      background:
                                        "linear-gradient(135deg, #FEF2F2 0%, #FFF7ED 100%)",
                                      border: "1px solid #EF444433",
                                      padding: "2px 7px",
                                      borderRadius: 999,
                                    }}
                                  >
                                    <FireFilled style={{ fontSize: 10 }} />
                                    {hotCount} HOT
                                  </span>
                                </Tooltip>
                              )}
                            </div>
                          }
                          extra={
                            <Button
                              type="link"
                              size="small"
                              onClick={() => router.push("/leads")}
                              style={{ fontSize: 11, fontWeight: 600 }}
                            >
                              View all{" "}
                              <ArrowRightOutlined style={{ fontSize: 10 }} />
                            </Button>
                          }
                        >

                          <div
                            style={{
                              flex: 1,
                              overflowY: "auto",
                              padding: 12,
                              position: "relative",
                              zIndex: 1,
                            }}
                            className="no-scrollbar"
                          >
                            {list.length > 0 ? (
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 8,
                                }}
                              >
                                {list.map((lead: any) => {
                                  const statusKey = (lead.status || "open")
                                    .toString()
                                    .toLowerCase();
                                  const sm =
                                    statusMeta[statusKey] || {
                                      label: (lead.status || "Open").replace(
                                        /_/g,
                                        " ",
                                      ),
                                      color: token.colorTextSecondary,
                                      bg: token.colorFillAlter,
                                    };
                                  const aiScore = Number(lead.ai_score);
                                  const hasAi = !Number.isNaN(aiScore) && aiScore > 0;
                                  const isHot = hasAi && aiScore >= 80;
                                  const rating = Number(lead.client_rating);
                                  const hasRating =
                                    !Number.isNaN(rating) && rating > 0;
                                  const verified =
                                    lead.client_payment_verified === true;
                                  const rate = lead.hourly_rate || lead.budget;
                                  const initial = (
                                    lead.client_name || "C"
                                  )
                                    .toString()
                                    .charAt(0)
                                    .toUpperCase();

                                  return (
                                    <div
                                      key={lead.id}
                                      onClick={() =>
                                        router.push(`/leads/view/${lead.id}`)
                                      }
                                      className="ticket-list-item"
                                      style={{
                                        position: "relative",
                                        cursor: "pointer",
                                        borderRadius: 12,
                                        border: `1px solid ${token.colorBorderSecondary}`,
                                        background: token.colorBgContainer,
                                        padding: "12px 14px 12px 16px",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 8,
                                        overflow: "hidden",
                                      }}
                                    >
                                      {/* Status left bar */}
                                      <div
                                        aria-hidden
                                        style={{
                                          position: "absolute",
                                          left: 0,
                                          top: 0,
                                          bottom: 0,
                                          width: 3,
                                          background: sm.color,
                                        }}
                                      />

                                      {/* Top row: title + status */}
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "space-between",
                                          gap: 8,
                                        }}
                                      >
                                        <Tooltip title={lead.title}>
                                          <div
                                            style={{
                                              fontSize: 13,
                                              fontWeight: 700,
                                              color: token.colorText,
                                              letterSpacing: "-0.1px",
                                              whiteSpace: "nowrap",
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                              flex: 1,
                                              minWidth: 0,
                                            }}
                                          >
                                            {lead.title}
                                          </div>
                                        </Tooltip>
                                        <span
                                          style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 5,
                                            fontSize: 9,
                                            fontWeight: 700,
                                            letterSpacing: "0.3px",
                                            color: sm.color,
                                            background: sm.bg,
                                            padding: "2px 7px",
                                            borderRadius: 999,
                                            border: `1px solid ${sm.color}26`,
                                            whiteSpace: "nowrap",
                                          }}
                                        >
                                          <span
                                            style={{
                                              width: 4,
                                              height: 4,
                                              borderRadius: "50%",
                                              background: sm.color,
                                              boxShadow: `0 0 5px ${sm.color}80`,
                                            }}
                                          />
                                          {sm.label.toUpperCase()}
                                        </span>
                                      </div>

                                      {/* Client + meta row */}
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "space-between",
                                          gap: 8,
                                        }}
                                      >
                                        <Space size={6} align="center" style={{ minWidth: 0, flex: 1 }}>
                                          <Avatar
                                            size={20}
                                            style={{
                                              backgroundColor: `${accent}22`,
                                              color: accent,
                                              fontSize: 10,
                                              fontWeight: 700,
                                              border: `1px solid ${accent}33`,
                                            }}
                                          >
                                            {initial}
                                          </Avatar>
                                          <Text
                                            style={{
                                              fontSize: 11.5,
                                              fontWeight: 600,
                                              color: token.colorTextSecondary,
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                              whiteSpace: "nowrap",
                                              maxWidth: 160,
                                            }}
                                          >
                                            {lead.client_name || "Client"}
                                          </Text>
                                          {lead.platform && (
                                            <span
                                              style={{
                                                fontSize: 9.5,
                                                fontWeight: 600,
                                                color: token.colorTextTertiary,
                                                background: token.colorFillAlter,
                                                border: `1px solid ${token.colorBorderSecondary}`,
                                                padding: "1px 6px",
                                                borderRadius: 6,
                                              }}
                                            >
                                              {lead.platform}
                                            </span>
                                          )}
                                        </Space>
                                        {rate && (
                                          <span
                                            style={{
                                              fontSize: 11.5,
                                              fontWeight: 700,
                                              color: token.colorText,
                                              fontVariantNumeric: "tabular-nums",
                                              whiteSpace: "nowrap",
                                            }}
                                          >
                                            {rate}
                                          </span>
                                        )}
                                      </div>

                                      {/* Skills row */}
                                      {lead.skills?.length > 0 && (
                                        <div
                                          style={{
                                            display: "flex",
                                            gap: 4,
                                            flexWrap: "wrap",
                                          }}
                                        >
                                          {lead.skills
                                            .slice(0, 4)
                                            .map((skill: string) => (
                                              <span
                                                key={skill}
                                                style={{
                                                  fontSize: 9.5,
                                                  fontWeight: 600,
                                                  color: accent,
                                                  background: `${accent}10`,
                                                  border: `1px solid ${accent}26`,
                                                  padding: "1px 6px",
                                                  borderRadius: 6,
                                                  lineHeight: 1.4,
                                                }}
                                              >
                                                {skill}
                                              </span>
                                            ))}
                                          {lead.skills.length > 4 && (
                                            <span
                                              style={{
                                                fontSize: 9.5,
                                                fontWeight: 600,
                                                color: token.colorTextTertiary,
                                                padding: "1px 4px",
                                              }}
                                            >
                                              +{lead.skills.length - 4}
                                            </span>
                                          )}
                                        </div>
                                      )}

                                      {/* Footer row */}
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "space-between",
                                          gap: 8,
                                          paddingTop: 6,
                                          borderTop: `1px dashed ${token.colorBorderSecondary}`,
                                        }}
                                      >
                                        <Space size={8} align="center">
                                          {hasAi && (
                                            <Tooltip
                                              title={`AI Match Score: ${aiScore}`}
                                            >
                                              <span
                                                style={{
                                                  display: "inline-flex",
                                                  alignItems: "center",
                                                  gap: 4,
                                                  fontSize: 10,
                                                  fontWeight: 700,
                                                  color: isHot
                                                    ? "#EF4444"
                                                    : "#7C3AED",
                                                }}
                                              >
                                                {isHot ? (
                                                  <FireFilled
                                                    style={{ fontSize: 10 }}
                                                  />
                                                ) : (
                                                  <ThunderboltFilled
                                                    style={{ fontSize: 10 }}
                                                  />
                                                )}
                                                AI {aiScore}
                                              </span>
                                            </Tooltip>
                                          )}
                                          {hasRating && (
                                            <Tooltip
                                              title={`Client rating: ${rating}/5`}
                                            >
                                              <span
                                                style={{
                                                  display: "inline-flex",
                                                  alignItems: "center",
                                                  gap: 3,
                                                  fontSize: 10,
                                                  fontWeight: 700,
                                                  color: "#F59E0B",
                                                }}
                                              >
                                                <StarFilled
                                                  style={{ fontSize: 9 }}
                                                />
                                                {rating.toFixed(1)}
                                              </span>
                                            </Tooltip>
                                          )}
                                          {verified && (
                                            <Tooltip title="Payment verified">
                                              <SafetyCertificateFilled
                                                style={{
                                                  fontSize: 11,
                                                  color: "#10B981",
                                                }}
                                              />
                                            </Tooltip>
                                          )}
                                        </Space>
                                        <Text
                                          style={{
                                            fontSize: 10,
                                            color: token.colorTextTertiary,
                                            fontWeight: 500,
                                          }}
                                        >
                                          {formatTimeAgo(lead.created_at)}
                                        </Text>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div
                                style={{
                                  textAlign: "center",
                                  padding: "32px 16px",
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  gap: 10,
                                }}
                              >
                                <div
                                  style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 14,
                                    background: `${accent}14`,
                                    border: `1px solid ${accent}33`,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: accent,
                                    fontSize: 20,
                                  }}
                                >
                                  <RocketOutlined />
                                </div>
                                <div>
                                  <Text
                                    strong
                                    style={{
                                      fontSize: 13,
                                      color: token.colorText,
                                      display: "block",
                                    }}
                                  >
                                    No leads yet
                                  </Text>
                                  <Text
                                    type="secondary"
                                    style={{ fontSize: 11 }}
                                  >
                                    Captured opportunities will appear here
                                  </Text>
                                </div>
                                <Button
                                  size="small"
                                  type="primary"
                                  onClick={() => router.push("/leads")}
                                  style={{
                                    background: accent,
                                    borderColor: accent,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    marginTop: 4,
                                  }}
                                >
                                  <PlusCircleOutlined /> Add lead
                                </Button>
                              </div>
                            )}
                          </div>
                        </Card>
                      );
                    })()}
                  </Col>

                  {/* Created Invoices */}
                  <Col xs={24} lg={12}>
                    {(() => {
                      const accent = "#10B981";
                      const list = createdInvoices.slice(0, 5);
                      const now = dayjs();
                      const isOverdue = (inv: any) =>
                        inv.dueDate &&
                        dayjs(inv.dueDate).isBefore(now, "day") &&
                        inv.status?.toUpperCase() !== "PAID";
                      const overdueCount = createdInvoices.filter(isOverdue).length;
                      const totalsByCurrency = createdInvoices.reduce(
                        (acc: Record<string, number>, inv: any) => {
                          const ccy = inv.currency || "—";
                          acc[ccy] = (acc[ccy] || 0) + (Number(inv.grandTotal) || 0);
                          return acc;
                        },
                        {},
                      );
                      const primaryCurrency =
                        Object.keys(totalsByCurrency)[0] || "";
                      const primaryTotal =
                        totalsByCurrency[primaryCurrency] || 0;

                      const statusMeta: Record<
                        string,
                        { label: string; color: string; bg: string }
                      > = {
                        PAID: { label: "Paid", color: "#10B981", bg: "#ECFDF5" },
                        PENDING: {
                          label: "Pending",
                          color: "#F59E0B",
                          bg: "#FFFBEB",
                        },
                        OVERDUE: {
                          label: "Overdue",
                          color: "#EF4444",
                          bg: "#FEF2F2",
                        },
                        SENT: { label: "Sent", color: "#0EA5E9", bg: "#F0F9FF" },
                        DRAFT: {
                          label: "Draft",
                          color: "#94A3B8",
                          bg: token.colorFillAlter,
                        },
                        CANCELLED: {
                          label: "Cancelled",
                          color: "#94A3B8",
                          bg: token.colorFillAlter,
                        },
                      };

                      return (
                        <Card
                          style={{
                            ...cardBase,
                            height: 340,
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden",
                            position: "relative",
                          }}
                          styles={{
                            body: {
                              padding: 0,
                              flex: 1,
                              display: "flex",
                              flexDirection: "column",
                              overflow: "hidden",
                            },
                          }}
                          title={
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                flexWrap: "wrap",
                                minWidth: 0,
                              }}
                            >
                              {sectionTitle(
                                <AuditOutlined />,
                                "Created Invoices",
                                accent,
                              )}
                              {createdInvoices.length > 0 && (
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    letterSpacing: "0.4px",
                                    color: accent,
                                    background: `${accent}14`,
                                    border: `1px solid ${accent}33`,
                                    padding: "2px 7px",
                                    borderRadius: 999,
                                    fontVariantNumeric: "tabular-nums",
                                  }}
                                >
                                  {createdInvoices.length} TOTAL
                                </span>
                              )}
                              {overdueCount > 0 && (
                                <Tooltip
                                  title={`${overdueCount} invoice(s) past due`}
                                >
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 5,
                                      fontSize: 10,
                                      fontWeight: 700,
                                      letterSpacing: "0.4px",
                                      color: "#EF4444",
                                      background: "#FEF2F2",
                                      border: "1px solid #EF444433",
                                      padding: "2px 7px",
                                      borderRadius: 999,
                                    }}
                                  >
                                    <span
                                      style={{
                                        width: 5,
                                        height: 5,
                                        borderRadius: "50%",
                                        background: "#EF4444",
                                        boxShadow: "0 0 6px #EF444480",
                                      }}
                                    />
                                    {overdueCount} OVERDUE
                                  </span>
                                </Tooltip>
                              )}
                              {primaryTotal > 0 && (
                                <Tooltip
                                  title={`Total billed in ${primaryCurrency}`}
                                >
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "baseline",
                                      gap: 4,
                                      fontSize: 11,
                                      fontWeight: 700,
                                      color: token.colorText,
                                      fontVariantNumeric: "tabular-nums",
                                      marginLeft: "auto",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: 9,
                                        fontWeight: 700,
                                        color: token.colorTextTertiary,
                                        letterSpacing: "0.3px",
                                      }}
                                    >
                                      {primaryCurrency}
                                    </span>
                                    {primaryTotal.toLocaleString(undefined, {
                                      maximumFractionDigits: 0,
                                    })}
                                  </span>
                                </Tooltip>
                              )}
                            </div>
                          }
                          extra={
                            <Button
                              type="link"
                              size="small"
                              onClick={() => router.push("/invoice/invoices")}
                              style={{ fontSize: 11, fontWeight: 600 }}
                            >
                              View all{" "}
                              <ArrowRightOutlined style={{ fontSize: 10 }} />
                            </Button>
                          }
                        >

                          <div
                            style={{
                              flex: 1,
                              overflowY: "auto",
                              padding: 12,
                              position: "relative",
                              zIndex: 1,
                            }}
                            className="no-scrollbar"
                          >
                            {list.length > 0 ? (
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 8,
                                }}
                              >
                                {list.map((invoice: any) => {
                                  const rawStatus = (
                                    invoice.status || "DRAFT"
                                  ).toUpperCase();
                                  const overdue = isOverdue(invoice);
                                  const effectiveStatus = overdue
                                    ? "OVERDUE"
                                    : rawStatus;
                                  const sm =
                                    statusMeta[effectiveStatus] || {
                                      label: rawStatus,
                                      color: token.colorTextSecondary,
                                      bg: token.colorFillAlter,
                                    };
                                  const due = invoice.dueDate
                                    ? dayjs(invoice.dueDate)
                                    : null;
                                  const daysToDue = due
                                    ? due.diff(now, "day")
                                    : null;
                                  const dueLabel =
                                    overdue && due
                                      ? `${Math.abs(daysToDue!)}d overdue`
                                      : daysToDue !== null
                                        ? daysToDue === 0
                                          ? "Due today"
                                          : daysToDue > 0
                                            ? `Due in ${daysToDue}d`
                                            : due?.format("MMM D, YYYY")
                                        : "No due date";
                                  const dueColor = overdue
                                    ? "#EF4444"
                                    : daysToDue !== null && daysToDue <= 3
                                      ? "#F59E0B"
                                      : token.colorTextTertiary;

                                  return (
                                    <div
                                      key={invoice.id}
                                      onClick={() =>
                                        router.push(`/invoice/invoices/view/${invoice.invoiceNumber}`)
                                      }
                                      className="ticket-list-item"
                                      style={{
                                        position: "relative",
                                        cursor: "pointer",
                                        borderRadius: 12,
                                        border: `1px solid ${token.colorBorderSecondary}`,
                                        background: token.colorBgContainer,
                                        padding: "12px 14px 12px 16px",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 8,
                                        overflow: "hidden",
                                      }}
                                    >
                                      {/* Status left bar */}
                                      <div
                                        aria-hidden
                                        style={{
                                          position: "absolute",
                                          left: 0,
                                          top: 0,
                                          bottom: 0,
                                          width: 3,
                                          background: sm.color,
                                        }}
                                      />

                                      {/* Top row: invoice no + client | status */}
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "space-between",
                                          gap: 8,
                                        }}
                                      >
                                        <Space size={6} align="center" style={{ minWidth: 0, flex: 1 }}>
                                          <span
                                            style={{
                                              fontSize: 9.5,
                                              fontWeight: 700,
                                              letterSpacing: "0.3px",
                                              color: token.colorTextSecondary,
                                              background: token.colorFillAlter,
                                              border: `1px solid ${token.colorBorderSecondary}`,
                                              padding: "2px 6px",
                                              borderRadius: 6,
                                              fontVariantNumeric: "tabular-nums",
                                              whiteSpace: "nowrap",
                                            }}
                                          >
                                            {invoice.invoiceNumber}
                                          </span>
                                          <Text
                                            style={{
                                              fontSize: 11.5,
                                              color: token.colorTextTertiary,
                                              fontWeight: 600,
                                              maxWidth: 140,
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                              whiteSpace: "nowrap",
                                            }}
                                          >
                                            ·{" "}
                                            {invoice.customer?.companyName ||
                                              "Client"}
                                          </Text>
                                        </Space>
                                        <span
                                          style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 5,
                                            fontSize: 9,
                                            fontWeight: 700,
                                            letterSpacing: "0.3px",
                                            color: sm.color,
                                            background: sm.bg,
                                            padding: "2px 7px",
                                            borderRadius: 999,
                                            border: `1px solid ${sm.color}26`,
                                            whiteSpace: "nowrap",
                                          }}
                                        >
                                          <span
                                            style={{
                                              width: 4,
                                              height: 4,
                                              borderRadius: "50%",
                                              background: sm.color,
                                              boxShadow: `0 0 5px ${sm.color}80`,
                                            }}
                                          />
                                          {sm.label.toUpperCase()}
                                        </span>
                                      </div>

                                      {/* Amount row */}
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "baseline",
                                          gap: 6,
                                        }}
                                      >
                                        <span
                                          style={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            color: token.colorTextTertiary,
                                            letterSpacing: "0.3px",
                                            textTransform: "uppercase",
                                          }}
                                        >
                                          {invoice.currency}
                                        </span>
                                        <span
                                          style={{
                                            fontSize: 20,
                                            fontWeight: 800,
                                            color: token.colorText,
                                            letterSpacing: "-0.5px",
                                            lineHeight: 1,
                                            fontVariantNumeric: "tabular-nums",
                                          }}
                                        >
                                          {Number(
                                            invoice.grandTotal || 0,
                                          ).toLocaleString(undefined, {
                                            maximumFractionDigits: 2,
                                          })}
                                        </span>
                                      </div>

                                      {/* Footer row: due + created */}
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "space-between",
                                          gap: 8,
                                          paddingTop: 6,
                                          borderTop: `1px dashed ${token.colorBorderSecondary}`,
                                        }}
                                      >
                                        <Tooltip
                                          title={
                                            due
                                              ? `Due ${due.format("MMM D, YYYY")}`
                                              : "No due date"
                                          }
                                        >
                                          <span
                                            style={{
                                              display: "inline-flex",
                                              alignItems: "center",
                                              gap: 5,
                                              fontSize: 10,
                                              fontWeight: 600,
                                              color: dueColor,
                                            }}
                                          >
                                            <CalendarOutlined
                                              style={{ fontSize: 10 }}
                                            />
                                            {dueLabel}
                                          </span>
                                        </Tooltip>
                                        <Text
                                          style={{
                                            fontSize: 10,
                                            color: token.colorTextTertiary,
                                            fontWeight: 500,
                                          }}
                                        >
                                          Created{" "}
                                          {dayjs(invoice.createdAt).format(
                                            "MMM D",
                                          )}
                                        </Text>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div
                                style={{
                                  textAlign: "center",
                                  padding: "32px 16px",
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  gap: 10,
                                }}
                              >
                                <div
                                  style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 14,
                                    background: `${accent}14`,
                                    border: `1px solid ${accent}33`,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: accent,
                                    fontSize: 20,
                                  }}
                                >
                                  <AuditOutlined />
                                </div>
                                <div>
                                  <Text
                                    strong
                                    style={{
                                      fontSize: 13,
                                      color: token.colorText,
                                      display: "block",
                                    }}
                                  >
                                    No invoices yet
                                  </Text>
                                  <Text
                                    type="secondary"
                                    style={{ fontSize: 11 }}
                                  >
                                    Generated invoices will appear here
                                  </Text>
                                </div>
                                <Button
                                  size="small"
                                  type="primary"
                                  onClick={() =>
                                    router.push("/invoice/create")
                                  }
                                  style={{
                                    background: accent,
                                    borderColor: accent,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    marginTop: 4,
                                  }}
                                >
                                  <PlusCircleOutlined /> Create invoice
                                </Button>
                              </div>
                            )}
                          </div>
                        </Card>
                      );
                    })()}
                  </Col>
                </Row>
              </>
            )}
          </>
        )}

        {/* ─── ORGANIZATION SEGMENT ─────────────────────────────── */}
        {activeSegment === "organization" && <Organization />}

        <TicketDetailDrawer
          ticketId={selectedTicketId}
          open={!!selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
          ticketIds={recentTickets.map((t: any) => t.id)}
          onNavigate={(id) => setSelectedTicketId(id)}
        />
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