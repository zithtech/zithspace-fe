"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import {
  dashboardService,
  DashboardData,
  ProjectProgress,
} from "@/services/dashboardService";
import { useZohoCalendar } from "@/hooks/useZohoCalendar";
import { DailyUpdateService } from "@/services/dailyUpdateService";
import TicketService from "@/services/ticketService";
import { AttendanceService } from "@/services/attendanceService";
import Organization from "@/components/organaization/Organization";

//import { dashboardService, DashboardData } from "@/services/dashboardService";
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Space,
  Progress,
  List,
  Popover,
  Avatar,
  Tag,
  Button,
  Divider,
  Alert,
  Skeleton,
  Badge,
  Tooltip,
  Segmented,
  Input,
  Modal,
  Table,
  Empty,
} from "antd";
import {
  TeamOutlined,
  ProjectOutlined,
  UserOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  TrophyOutlined,
  RiseOutlined,
  CalendarOutlined,
  BellOutlined,
  PlusOutlined,
  FileTextOutlined,
  VideoCameraOutlined,
  EnvironmentOutlined,
  LinkOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StarOutlined,
  LoginOutlined,
  LogoutOutlined,
  FormOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { redirect, useRouter } from "next/navigation";
import dayjs from "dayjs";

const { Title, Text } = Typography;

function DashboardContent() {
  const { user, isLoading: authLoading } = useAuth();
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
  const [activeSegment, setActiveSegment] = useState<"me" | "organization">(
    "me",
  );
  const [isClocking, setIsClocking] = useState(false);
  const [recentTickets, setRecentTickets] = useState<any[]>([]);

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

  // Dynamic Calendar Integration - works with any connected provider
  const {
    status: calendarStatus,
    events: calendarEvents,
    loading: calendarLoading,
    connect: connectCalendar,
    disconnect: disconnectCalendar,
    syncEvents: syncCalendar,
    error: calendarError,
    successMessage: calendarSuccess,
  } = useZohoCalendar();

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
        // Clone event with today's date for display
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

  // Upcoming meetings (next 7 days)
  const upcomingMeetings = calendarEvents
    .filter((event) => {
      // Filter: User must be an attendee or the creator
      const isUserAttendee =
        event.attendees?.includes(user?.email) || event.userId === user?.id;
      if (!isUserAttendee) return false;

      const eventDate = dayjs(event.startTime);
      const today = dayjs().startOf("day");
      const nextWeek = today.add(7, "day");
      return eventDate.isAfter(today) && eventDate.isBefore(nextWeek);
    })
    .sort(
      (a, b) => dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf(),
    );

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
        console.log("Today Attendance:", attendance);

        // State la store pannuthu
        setTodayAttendance(attendance);

        // console.log("Clock In Time:", attendance.clockInTime);
        // console.log("Clock Out Time:", attendance.clockOutTime);
      } catch (error) {
        console.error("Failed to fetch attendance", error);
      }
    };

    fetchTodayAttendance(); // function call pannanu
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

          // Separate BOD & EOD
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
          // Set stats to 0 on error to avoid incorrect display
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "#ff4d4f";
      case "medium":
        return "#faad14";
      case "low":
        return "#52c41a";
      default:
        return "#d9d9d9";
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return "#52c41a";
    if (progress >= 40) return "#1677ff";
    return "#faad14";
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60)
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })}`;
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })}`;
    }
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const selectedProject = dashboardData?.projectProgress.find(
    (p) => p.id === selectedProjectId,
  );

  // Statistics cards configuration
  const stats = dashboardData
    ? [
      {
        title: "Assigned Tickets / Closed Tickets",
        value: `${myTicketsStats.total} / ${myTicketsStats.closed}`,
        icon: <UserOutlined style={{ color: "#faad14" }} />,
        color: "#faad14",
        change: dashboardData.trends.ticketCompletionRate,
      },
      {
        title: "Average Working Hours ",
        value: averageWorkHours,
        icon: <ProjectOutlined style={{ color: "#52c41a" }} />,
        color: "#52c41a",
        change: "Last 5 days avg",
      },
      {
        title: "Today's Attendance",
        value: `${dashboardData.stats.attendance.present} / ${dashboardData.stats.totalMembers}`,
        icon: <ClockCircleOutlined style={{ color: "#722ed1" }} />,
        color: "#722ed1",
        change: `${dashboardData.stats.attendance.attendanceRate}% Present`,
        isAttendance: true,
        stats: dashboardData.stats.attendance,
      },
    ]
    : [];

  const LegendItem = ({
    color,
    label,
    value,
  }: {
    color: string;
    label: string;
    value: string | number;
  }) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
      <div
        style={{
          width: 8,
          height: 8,
          background: color,
          borderRadius: "50%",
          marginBottom: "2px",
        }}
      />
      <Text style={{ fontSize: 10, color: "#888", lineHeight: 1, textAlign: "center" }}>
        {label}
      </Text>
      <Text strong style={{ fontSize: 13, lineHeight: 1.2, textAlign: "center" }}>
        {value}
      </Text>
    </div>
  );

  const renderTicketSummary = () => {
    if (!tickets || tickets.length === 0) {
      return (
        <div
          style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Empty description="No tickets found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      );
    }

    const totalTickets = tickets.length;
    const completedTickets = tickets.filter((t) =>
      ["completed", "live", "done"].includes(t.status?.toLowerCase())
    ).length;
    const inProgressTickets = tickets.filter(
      (t) => t.status?.toLowerCase() === "in_progress" || t.status?.toLowerCase() === "doing"
    ).length;
    const blockedTickets = tickets.filter(
      (t) => t.status?.toLowerCase() === "blocked"
    ).length;

    const completionRate = totalTickets > 0 ? Math.round((completedTickets / totalTickets) * 100) : 0;

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'center',
        padding: '0 4px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 4,
          position: 'relative',
          paddingTop: 4
        }}>
          <Progress
            type="dashboard"
            percent={completionRate}
            strokeColor={{
              '0%': '#1677ff',
              '100%': '#52c41a',
            }}
            strokeWidth={10}
            width={115}
            gapDegree={80}
            format={(percent) => (
              <div style={{ marginTop: -5 }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#262626', letterSpacing: '-0.5px' }}>{percent}%</div>
                <div style={{ fontSize: 8, color: '#bfbfbf', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Success</div>
              </div>
            )}
          />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          marginTop: '0px'
        }}>
          {/* Active Pill */}
          <div style={{
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(22, 119, 255, 0.08) 0%, rgba(22, 119, 255, 0.02) 100%)',
            padding: '8px 4px',
            borderRadius: '12px',
            border: '1px solid rgba(22, 119, 255, 0.12)',
            transition: 'all 0.3s'
          }} className="metric-pill">
            <Space direction="vertical" size={0}>
              <Text strong style={{ fontSize: 16, color: '#1677ff', lineHeight: 1 }}>{inProgressTickets}</Text>
              <Text style={{ fontSize: 8, color: '#1677ff', textTransform: 'uppercase', fontWeight: 700 }}>Active</Text>
            </Space>
          </div>

          {/* Done Pill */}
          <div style={{
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(82, 196, 26, 0.08) 0%, rgba(82, 196, 26, 0.02) 100%)',
            padding: '8px 4px',
            borderRadius: '12px',
            border: '1px solid rgba(82, 196, 26, 0.12)',
            transition: 'all 0.3s'
          }} className="metric-pill">
            <Space direction="vertical" size={0}>
              <Text strong style={{ fontSize: 16, color: '#52c41a', lineHeight: 1 }}>{completedTickets}</Text>
              <Text style={{ fontSize: 8, color: '#52c41a', textTransform: 'uppercase', fontWeight: 700 }}>Done</Text>
            </Space>
          </div>

          {/* Blocked/Total Pill */}
          <div style={{
            textAlign: 'center',
            background: blockedTickets > 0
              ? 'linear-gradient(135deg, rgba(255, 77, 79, 0.08) 0%, rgba(255, 77, 79, 0.02) 100%)'
              : 'linear-gradient(135deg, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0.02) 100%)',
            padding: '8px 4px',
            borderRadius: '12px',
            border: blockedTickets > 0 ? '1px solid rgba(255, 77, 79, 0.15)' : '1px solid #e8e8e8',
            transition: 'all 0.3s'
          }} className="metric-pill">
            <Space direction="vertical" size={0}>
              <Text strong style={{ fontSize: 16, color: blockedTickets > 0 ? '#ff4d4f' : '#595959', lineHeight: 1 }}>
                {blockedTickets > 0 ? blockedTickets : totalTickets}
              </Text>
              <Text style={{ fontSize: 8, color: blockedTickets > 0 ? '#ff4d4f' : '#8c8c8c', textTransform: 'uppercase', fontWeight: 700 }}>
                {blockedTickets > 0 ? 'Blocked' : 'Total'}
              </Text>
            </Space>
          </div>
        </div>
      </div>
    );
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

  return (
    <MainLayout>
      <div style={{ background: "white" }}>
        <div style={{ padding: 20 }}>
          {/* ✅ UPDATED HEADER WITH SEGMENT SWITCHER */}
          <div
            style={{
              marginBottom: 16,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <Title level={2} style={{ margin: 0, color: "#262626" }}>
                Welcome back, {user?.name}!
              </Title>
              <Text type="secondary" style={{ fontSize: 14 }}>
                Here&apos;s what&apos;s happening with your projects today.
              </Text>
            </div>

            <Segmented
              options={[
                { label: "Me", value: "me" },
                { label: "Organization", value: "organization" },
              ]}
              value={activeSegment}
              onChange={(value) =>
                setActiveSegment(value as "me" | "organization")
              }
            />
          </div>

          {/* ✅ ME SEGMENT — your full original dashboard */}
          {activeSegment === "me" && (
            <>
              {/* Error Alert */}
              {error && (
                <Alert
                  message="Error"
                  description={error}
                  type="error"
                  showIcon
                  closable
                  style={{ marginBottom: 16 }}
                />
              )}

              {/* Calendar Error/Success Alerts */}
              {calendarError && (
                <Alert
                  message="Calendar Error"
                  description={calendarError}
                  type="error"
                  showIcon
                  closable
                  style={{ marginBottom: 16 }}
                />
              )}
              {calendarSuccess && (
                <Alert
                  message="Success"
                  description={calendarSuccess}
                  type="success"
                  showIcon
                  closable
                  style={{ marginBottom: 16 }}
                />
              )}

              {/* Loading State */}
              {loading ? (
                <>
                  <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    {[1, 2, 3, 4].map((i) => (
                      <Col xs={24} sm={12} lg={6} key={i}>
                        <Card size="small">
                          <Skeleton active paragraph={{ rows: 1 }} />
                        </Card>
                      </Col>
                    ))}
                  </Row>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} lg={16}>
                      <Card size="small">
                        <Skeleton active />
                      </Card>
                    </Col>
                    <Col xs={24} lg={8}>
                      <Card size="small">
                        <Skeleton active />
                      </Card>
                    </Col>
                  </Row>
                </>
              ) : dashboardData ? (
                <>
                  {/* Statistics Cards */}
                  <Row gutter={[16, 16]} style={{ marginBottom: 12 }}>
                    <Col xs={24} sm={12} lg={6}>
                      <Card
                        size="small"
                        style={{ height: "100%", borderLeft: "4px solid grey" }}
                        styles={{
                          body: { padding: "8px 16px", height: "100%" },
                        }}
                      >
                        <Row
                          align="middle"
                          justify="space-around"
                          style={{ height: "100%" }}
                        >
                          <Col xs={24} sm={11}>
                            <Space
                              align="center"
                              style={{
                                justifyContent: "space-between",
                                width: "100%",
                              }}
                            >
                              <Statistic
                                title="Beginning of Day"
                                value={
                                  todayUpdates.bod
                                    ? "BOD – Updated"
                                    : "Not Submitted"
                                }
                                valueStyle={{
                                  fontSize: 12,
                                  fontWeight: 500,
                                  color: todayUpdates.bod
                                    ? "#52c41a"
                                    : "#faad14",
                                }}
                              />
                              <RiseOutlined
                                style={{
                                  fontSize: 16,
                                  color: todayUpdates.bod
                                    ? "#52c41a"
                                    : "#faad14",
                                }}
                              />
                            </Space>
                          </Col>

                          <Col xs={24} sm={0}>
                            <Divider style={{ margin: "8px 0" }} />
                          </Col>
                          <Col
                            xs={0}
                            sm={1}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Divider
                              type="vertical"
                              style={{ height: "40px" }}
                            />
                          </Col>

                          <Col xs={24} sm={11}>
                            <Space
                              align="center"
                              style={{
                                justifyContent: "space-between",
                                width: "100%",
                              }}
                            >
                              <Statistic
                                title="End of Day"
                                value={
                                  todayUpdates.eod
                                    ? "EOD – Updated"
                                    : "Not Submitted"
                                }
                                valueStyle={{
                                  fontSize: 12,
                                  fontWeight: 500,
                                  color: todayUpdates.eod
                                    ? "#52c41a"
                                    : "#faad14",
                                }}
                              />
                              <StarOutlined
                                style={{
                                  fontSize: 16,
                                  color: todayUpdates.eod
                                    ? "#52c41a"
                                    : "#faad14",
                                }}
                              />
                            </Space>
                          </Col>
                        </Row>
                      </Card>
                    </Col>
                    {stats.map((stat, index) => (
                      <Col xs={24} sm={12} lg={6} key={index}>
                        <Card
                          size="small"
                          style={{
                            borderLeft: `4px solid grey`,
                            height: "100%",
                          }}
                          styles={{ body: { padding: 16 } }}
                        >
                          <Space
                            direction="vertical"
                            size={4}
                            style={{ width: "100%" }}
                          >
                            <Space
                              align="center"
                              style={{
                                width: "100%",
                                justifyContent: "space-between",
                              }}
                            >
                              <Text
                                type="secondary"
                                style={{ fontSize: 12, fontWeight: 500 }}
                              >
                                {stat.title}
                              </Text>
                              {stat.icon}
                            </Space>
                            <Space align="baseline">
                              <Statistic
                                value={stat.value as string | number}
                                valueStyle={{
                                  fontSize: 24,
                                  fontWeight: 600,
                                  color: "#262626",
                                  lineHeight: 1,
                                }}
                              />
                              <Tag
                                color={stat.isAttendance ? "purple" : "green"}
                                style={{
                                  fontSize: 10,
                                  padding: "0 4px",
                                  margin: 0,
                                  border: "none",
                                }}
                              >
                                {stat.change}
                              </Tag>
                            </Space>
                          </Space>
                        </Card>
                      </Col>
                    ))}
                  </Row>

                  {/* Row 1: My Info */}
                  <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col xs={24} lg={8}>
                      {/* My Tickets */}
                      <Card
                        title={
                          <Space>
                            <TrophyOutlined style={{ color: "#1677ff" }} />
                            <span>My Tickets</span>
                            <span className="live-pulse" style={{ marginLeft: 8 }} />
                          </Space>
                        }
                        size="small"
                        extra={
                          <Button
                            type="link"
                            size="small"
                            onClick={() => router.push("/tickets")}
                          >
                            View Tickets
                          </Button>
                        }
                        styles={{ body: { padding: 8 } }}
                        style={{ height: "280px" }}
                      >
                        <div style={{ height: "100%" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: 4,
                            }}
                          >

                          </div>
                          {renderTicketSummary()}
                        </div>
                      </Card>
                    </Col>
                    <Col xs={24} lg={8}>
                      {/* Today's Meetings */}
                      <div style={{ height: "100%" }}>
                        {/* <Card
                          title={
                            <Space size={4}>
                              <VideoCameraOutlined
                                style={{ color: "#1677ff", fontSize: 14 }}
                              />
                              <span style={{ fontSize: 13 }}>
                                Today's Meetings
                              </span>
                              {!calendarStatus?.connected && (
                                <Button
                                  type="link"
                                  size="small"
                                  onClick={connectCalendar}
                                  loading={calendarLoading}
                                  style={{ marginLeft: 4, fontSize: 11 }}
                                >
                                  Connect
                                </Button>
                              )}
                            </Space>
                          }
                          size="small"
                          extra={
                            calendarStatus?.connected && (
                              <Space size={2}>
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<ClockCircleOutlined />}
                                  onClick={syncCalendar}
                                  loading={calendarLoading}
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
                            )
                          }
                          styles={{ body: { padding: 0 } }}
                          style={{ height: "280px" }}
                        >
                          {calendarLoading ? (
                            <div style={{ padding: 16, textAlign: "center" }}>
                              <Skeleton active paragraph={{ rows: 2 }} />
                            </div>
                          ) : !calendarStatus?.connected ? (
                            <div style={{ padding: 12, textAlign: "center" }}>
                              <VideoCameraOutlined
                                style={{
                                  fontSize: 28,
                                  color: "#bfbfbf",
                                  marginBottom: 6,
                                }}
                              />
                              <div>
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                  Connect calendar to see meetings
                                </Text>
                              </div>
                              <Button
                                type="primary"
                                size="small"
                                onClick={connectCalendar}
                                style={{
                                  marginTop: 8,
                                  fontSize: 11,
                                  height: 24,
                                }}
                              >
                                Connect Zoho Calendar
                              </Button>
                            </div>
                          ) : todaysMeetings.length > 0 ? (
                            <div style={{ height: 220, overflowY: "auto" }}>
                              <List
                                size="small"
                                dataSource={todaysMeetings}
                                renderItem={(meeting) => {
                                  const startTime = dayjs(meeting.startTime);
                                  const endTime = dayjs(meeting.endTime);
                                  const isOngoing =
                                    startTime.isBefore(dayjs()) &&
                                    endTime.isAfter(dayjs());

                                  return (
                                    <List.Item
                                      style={{
                                        padding: "6px 10px",
                                        borderBottom: "1px solid #f0f0f0",
                                        background: isOngoing
                                          ? "#f6ffed"
                                          : "transparent",
                                      }}
                                      actions={[
                                        <Tooltip
                                          title="Join Meeting"
                                          key="join"
                                        >
                                          <Button
                                            type="primary"
                                            size="small"
                                            icon={<VideoCameraOutlined />}
                                            onClick={() =>
                                              meeting.meetingLink &&
                                              window.open(
                                                meeting.meetingLink,
                                                "_blank",
                                              )
                                            }
                                            disabled={!meeting.meetingLink}
                                            style={{
                                              height: 24,
                                              width: 24,
                                              backgroundColor:
                                                meeting.meetingLink
                                                  ? "#1677ff"
                                                  : "#f5f5f5",
                                              borderColor: meeting.meetingLink
                                                ? "#1677ff"
                                                : "#d9d9d9",
                                            }}
                                          />
                                        </Tooltip>,
                                      ]}
                                    >
                                      <List.Item.Meta
                                        avatar={
                                          <Avatar
                                            size={22}
                                            style={{
                                              backgroundColor: isOngoing
                                                ? "#52c41a"
                                                : "#1677ff",
                                              fontSize: 10,
                                            }}
                                          >
                                            {meeting.title.charAt(0)}
                                          </Avatar>
                                        }
                                        title={
                                          <Space align="center" size={2}>
                                            <Text
                                              strong
                                              style={{ fontSize: 11 }}
                                            >
                                              {meeting.title.length > 18
                                                ? meeting.title.substring(
                                                  0,
                                                  18,
                                                ) + "..."
                                                : meeting.title}
                                            </Text>
                                            {isOngoing && (
                                              <Badge
                                                status="processing"
                                                style={{ fontSize: 9 }}
                                                text="Live"
                                              />
                                            )}
                                          </Space>
                                        }
                                        description={
                                          <Text
                                            type="secondary"
                                            style={{ fontSize: 9 }}
                                          >
                                            <ClockCircleOutlined
                                              style={{
                                                marginRight: 2,
                                                fontSize: 8,
                                              }}
                                            />
                                            {startTime.format("hh:mm A")} -{" "}
                                            {endTime.format("hh:mm A")}
                                          </Text>
                                        }
                                      />
                                    </List.Item>
                                  );
                                }}
                              />
                            </div>
                          ) : (
                            <div style={{ padding: 20, textAlign: "center" }}>
                              <VideoCameraOutlined
                                style={{
                                  fontSize: 24,
                                  color: "#bfbfbf",
                                  marginBottom: 6,
                                }}
                              />
                              <div>
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                  No meetings scheduled
                                </Text>
                              </div>
                            </div>
                          )}
                        </Card> */}
                        <Card
                          title={
                            <Space size={4}>
                              <VideoCameraOutlined style={{ color: "#1677ff", fontSize: 14 }} />
                              <span style={{ fontSize: 13 }}>Today's Meetings</span>
                              {!calendarStatus?.connected && (
                                <Button
                                  type="link"
                                  size="small"
                                  onClick={connectCalendar}
                                  loading={calendarLoading}
                                  style={{ marginLeft: 4, fontSize: 11 }}
                                >
                                  Connect
                                </Button>
                              )}
                            </Space>
                          }
                          size="small"
                          extra={
                            calendarStatus?.connected && (
                              <Space size={2}>
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<ClockCircleOutlined />}
                                  onClick={syncCalendar}
                                  loading={calendarLoading}
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
                            )
                          }
                          styles={{ body: { padding: 0 } }}
                          style={{ height: '280px' }}
                        >
                          {calendarLoading ? (
                            <div style={{ padding: 16, textAlign: "center" }}>
                              <Skeleton active paragraph={{ rows: 2 }} />
                            </div>
                          ) : !calendarStatus?.connected ? (
                            <div style={{ padding: 20, textAlign: "center" }}>
                              <VideoCameraOutlined style={{ fontSize: 28, color: "#bfbfbf", marginBottom: 6 }} />
                              <div>
                                <Text type="secondary" style={{ fontSize: 11 }}>Connect calendar to see meetings</Text>
                              </div>
                              <Button
                                type="primary"
                                size="small"
                                onClick={connectCalendar}
                                style={{ marginTop: 8, fontSize: 11, height: 24 }}
                              >
                                Connect Zoho Calendar
                              </Button>
                            </div>
                          ) : todaysMeetings.length > 0 ? (
                            <div style={{ height: 220, overflowY: 'auto' }}>
                              <List
                                size="small"
                                dataSource={todaysMeetings}
                                renderItem={(meeting) => {
                                  const startTime = dayjs(meeting.startTime);
                                  const endTime = dayjs(meeting.endTime);
                                  const isOngoing = startTime.isBefore(dayjs()) && endTime.isAfter(dayjs());

                                  return (
                                    <List.Item
                                      style={{
                                        padding: "6px 10px",
                                        borderBottom: "1px solid #f0f0f0",
                                        background: isOngoing ? "#f6ffed" : "transparent"
                                      }}
                                      actions={[
                                        <Tooltip title="Join Meeting" key="join">
                                          <Button
                                            type="primary"
                                            size="small"
                                            icon={<VideoCameraOutlined />}
                                            onClick={() => meeting.meetingLink && window.open(meeting.meetingLink, '_blank')}
                                            disabled={!meeting.meetingLink}
                                            style={{
                                              height: 24,
                                              width: 24,
                                              backgroundColor: meeting.meetingLink ? "#1677ff" : "#f5f5f5",
                                              borderColor: meeting.meetingLink ? "#1677ff" : "#d9d9d9"
                                            }}
                                          />
                                        </Tooltip>
                                      ]}
                                    >
                                      <List.Item.Meta
                                        avatar={
                                          <Avatar
                                            size={22}
                                            style={{
                                              backgroundColor: isOngoing ? "#52c41a" : "#1677ff",
                                              fontSize: 10
                                            }}
                                          >
                                            {meeting.title.charAt(0)}
                                          </Avatar>
                                        }
                                        title={
                                          <Space align="center" size={2}>
                                            <Text strong style={{ fontSize: 11 }}>
                                              {meeting.title.length > 18 ? meeting.title.substring(0, 18) + '...' : meeting.title}
                                            </Text>
                                            {isOngoing && (
                                              <Badge status="processing" style={{ fontSize: 9 }} text="Live" />
                                            )}
                                          </Space>
                                        }
                                        description={
                                          <Text type="secondary" style={{ fontSize: 9 }}>
                                            <ClockCircleOutlined style={{ marginRight: 2, fontSize: 8 }} />
                                            {startTime.format("hh:mm A")} - {endTime.format("hh:mm A")}
                                          </Text>
                                        }
                                      />
                                    </List.Item>
                                  );
                                }}
                              />
                            </div>
                          ) : (
                            <div style={{ padding: 20, textAlign: "center" }}>
                              <VideoCameraOutlined style={{ fontSize: 24, color: "#bfbfbf", marginBottom: 6 }} />
                              <div>
                                <Text type="secondary" style={{ fontSize: 11 }}>No meetings scheduled</Text>
                              </div>
                            </div>
                          )}
                        </Card>
                      </div>
                    </Col>
                    <Col xs={24} lg={8}>
                      {/* My Attendance */}
                      <Card
                        title={
                          <Space>
                            <ClockCircleOutlined style={{ color: "#722ed1" }} />
                            <span>My Attendance</span>
                          </Space>
                        }
                        extra={
                          todayAttendance && (
                            <Tag
                              color={todayAttendance.canClockIn ? "default" : todayAttendance.canClockOut ? "processing" : "success"}
                              style={{ borderRadius: '6px', margin: 0 }}
                            >
                              {todayAttendance.canClockIn ? "Not Clocked In" : todayAttendance.canClockOut ? "Active Now" : "Shift Completed"}
                            </Tag>
                          )
                        }
                        size="small"
                        style={{
                          height: "280px",
                          borderRadius: "16px",
                          border: "1px solid #f0f0f0",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                          overflow: 'hidden'
                        }}
                        styles={{ body: { padding: '20px 24px' } }}
                      >
                        {todayAttendance ? (
                          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div style={{ textAlign: 'center', marginBottom: 12 }}>
                              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>TOTAL WORK DURATION</Text>
                              <div style={{
                                fontSize: 32,
                                fontWeight: 700,
                                color: (todayAttendance.canClockOut) ? '#722ed1' : '#262626',
                                letterSpacing: '-0.5px',
                                lineHeight: 1
                              }}>
                                {workDuration || "00:00:00"}
                              </div>
                            </div>

                            <div style={{
                              // background: '#f9f0ff',
                              borderRadius: '12px',
                              padding: '12px',
                              display: 'flex',
                              justifyContent: 'space-around',
                              marginBottom: 16
                            }}>
                              <div style={{ textAlign: 'center' }}>
                                <Text type="secondary" style={{ fontSize: 10, display: 'block', marginBottom: 2 }}>CLOCK IN</Text>
                                <Space size={4}>
                                  <LoginOutlined style={{ fontSize: 12, color: '#52c41a' }} />
                                  <Text strong style={{ fontSize: 13 }}>
                                    {todayAttendance.clockInTime ? dayjs(todayAttendance.clockInTime).format("hh:mm A") : "--:--"}
                                  </Text>
                                </Space>
                              </div>
                              <Divider type="vertical" style={{ height: '32px', borderLeftColor: '#d6e4ff' }} />
                              <div style={{ textAlign: 'center' }}>
                                <Text type="secondary" style={{ fontSize: 10, display: 'block', marginBottom: 2 }}>CLOCK OUT</Text>
                                <Space size={4}>
                                  <LogoutOutlined style={{ fontSize: 12, color: '#ff4d4f' }} />
                                  <Text strong style={{ fontSize: 13 }}>
                                    {todayAttendance.clockOutTime ? dayjs(todayAttendance.clockOutTime).format("hh:mm A") : "--:--"}
                                  </Text>
                                </Space>
                              </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "center" }}>
                              {todayAttendance.canClockIn ? (
                                <Button
                                  type="primary"
                                  block
                                  icon={<PlayCircleOutlined />}
                                  onClick={handleClockIn}
                                  loading={isClocking}
                                  size="large"
                                  style={{
                                    borderRadius: '10px',
                                    height: 44,
                                    background: '#722ed1',
                                    borderColor: '#722ed1',
                                    boxShadow: '0 4px 10px rgba(114, 46, 209, 0.25)',
                                    fontWeight: 600
                                  }}
                                >
                                  Clock In Now
                                </Button>
                              ) : todayAttendance.canClockOut ? (
                                <Button
                                  danger
                                  block
                                  icon={<PauseCircleOutlined />}
                                  onClick={handleClockOut}
                                  loading={isClocking}
                                  size="large"
                                  style={{
                                    borderRadius: '10px',
                                    height: 44,
                                    boxShadow: '0 4px 10px rgba(255, 77, 79, 0.2)',
                                    fontWeight: 600
                                  }}
                                >
                                  Clock Out
                                </Button>
                              ) : (
                                <div style={{
                                  width: '100%',
                                  padding: '10px',
                                  // background: '#f6ffed',
                                  border: '1px solid #b7eb8f',
                                  borderRadius: '10px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 8,
                                  color: '#52c41a',
                                  fontWeight: 500
                                }}>
                                  <TrophyOutlined />
                                  <span>Shift Completed Successfully</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <Skeleton active paragraph={{ rows: 4 }} />
                        )}
                      </Card>
                    </Col>
                  </Row>

                  {/* Row 2: Leave & Recent Tickets */}
                  <Row gutter={[16, 16]}>
                    <Col xs={24} lg={8}>
                      {/* Action Cards Container */}
                      <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        {/* Apply Leave Card */}
                        <Card
                          hoverable
                          style={{
                            borderRadius: 14,
                            // background: 'linear-gradient(135deg, #e6f4ff 0%, #ffffff 100%)',
                            border: '1px solid #bae0ff',
                            boxShadow: '0 2px 8px rgba(22, 119, 255, 0.04)',
                            overflow: 'hidden'
                          }}
                          styles={{ body: { padding: '12px 16px' } }}
                          onClick={() => router.push("/leave/apply")}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{
                              width: 38,
                              height: 38,
                              borderRadius: 10,
                              background: '#1677ff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 4px rgba(22, 119, 255, 0.15)'
                            }}>
                              <FormOutlined style={{ fontSize: 20, color: '#fff' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <Title level={5} style={{ margin: 0, color: '#262626', fontSize: 14, fontWeight: 700 }}>Apply Leave</Title>
                              <Text type="secondary" style={{ fontSize: 11 }}>Request time off easily</Text>
                            </div>
                            <Button
                              type="primary"
                              shape="circle"
                              size="small"
                              icon={<PlusOutlined style={{ fontSize: 12 }} />}
                              style={{
                                background: '#1677ff',
                                border: 'none',
                                width: 24,
                                height: 24,
                                minWidth: 24
                              }}
                            />
                          </div>
                        </Card>

                        {/* Apply Reimbursement Card */}
                        <Card
                          hoverable
                          style={{
                            borderRadius: 14,
                            // background: 'linear-gradient(135deg, #f9f0ff 0%, #ffffff 100%)',
                            border: '1px solid #efdbff',
                            boxShadow: '0 2px 8px rgba(114, 46, 209, 0.04)',
                            overflow: 'hidden'
                          }}
                          styles={{ body: { padding: '12px 16px' } }}
                          onClick={() => router.push("/reimbursement/apply")}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{
                              width: 38,
                              height: 38,
                              borderRadius: 10,
                              background: '#722ed1',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 4px rgba(114, 46, 209, 0.15)'
                            }}>
                              <WalletOutlined style={{ fontSize: 20, color: '#fff' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <Title level={5} style={{ margin: 0, color: '#262626', fontSize: 14, fontWeight: 700 }}>Reimbursement</Title>
                              <Text type="secondary" style={{ fontSize: 11 }}>Submit expense claims</Text>
                            </div>
                            <Button
                              type="primary"
                              shape="circle"
                              size="small"
                              icon={<PlusOutlined style={{ fontSize: 12 }} />}
                              style={{
                                background: '#722ed1',
                                border: 'none',
                                width: 24,
                                height: 24,
                                minWidth: 24
                              }}
                            />
                          </div>
                        </Card>

                        {/* Submit Timesheet Card */}
                        <Card
                          hoverable
                          style={{
                            borderRadius: 14,
                            // background: 'linear-gradient(135deg, #e6fffb 0%, #ffffff 100%)',
                            border: '1px solid #87e8de',
                            boxShadow: '0 2px 8px rgba(19, 194, 194, 0.04)',
                            overflow: 'hidden'
                          }}
                          styles={{ body: { padding: '12px 16px' } }}
                          onClick={() => router.push("/timesheet/submit")}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{
                              width: 38,
                              height: 38,
                              borderRadius: 10,
                              background: '#13c2c2',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 4px rgba(19, 194, 194, 0.15)'
                            }}>
                              <ClockCircleOutlined style={{ fontSize: 20, color: '#fff' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <Title level={5} style={{ margin: 0, color: '#262626', fontSize: 14, fontWeight: 700 }}>Submit Timesheet</Title>
                              <Text type="secondary" style={{ fontSize: 11 }}>Log your daily hours</Text>
                            </div>
                            <Button
                              type="primary"
                              shape="circle"
                              size="small"
                              icon={<PlusOutlined style={{ fontSize: 12 }} />}
                              style={{
                                background: '#13c2c2',
                                border: 'none',
                                width: 24,
                                height: 24,
                                minWidth: 24
                              }}
                            />
                          </div>
                        </Card>
                      </Space>
                    </Col>
                    <Col xs={24} lg={16}>
                      {/* Recent Tickets */}
                      <Card
                        title={
                          <Space>
                            <FileTextOutlined style={{ color: "#722ed1" }} />
                            <span>Recent Tickets</span>
                          </Space>
                        }
                        size="small"
                        extra={
                          <Button
                            type="link"
                            size="small"
                            onClick={() => router.push("/tickets")}
                          >
                            View All
                          </Button>
                        }
                        style={{
                          height: "230px",
                          display: "flex",
                          flexDirection: "column",
                        }}
                        bodyStyle={{
                          padding: 0,
                          flex: 1,
                          overflowY: "auto",
                        }}
                      >
                        <List
                          dataSource={recentTickets}
                          className="no-scrollbar"
                          style={{ padding: '0 4px' }}
                          renderItem={(item: any) => (
                            <List.Item
                              onClick={() => router.push(`/tickets/${item.id}`)}
                              style={{
                                padding: "12px 14px",
                                cursor: "pointer",
                                borderBottom: "1px solid #f0f0f0",
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                borderRadius: '12px',
                                margin: '4px 0'
                              }}
                              className="ticket-list-item"
                            >
                              {/* Priority Bar Indicator */}
                              <div
                                style={{
                                  width: "4px",
                                  height: "36px",
                                  borderRadius: "2px",
                                  background: getPriorityColor(item.priority),
                                  flexShrink: 0,
                                }}
                              />

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: 3,
                                  }}
                                >
                                  <Space size={8}>
                                    <Text
                                      type="secondary"
                                      style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.2px' }}
                                    >
                                      {item.ticketNumber}
                                    </Text>
                                    <Tag
                                      style={{
                                        fontSize: 9,
                                        margin: 0,
                                        borderRadius: "4px",
                                        background: "#f5f5f5",
                                        border: "none",
                                        color: '#8c8c8c'
                                      }}
                                    >
                                      {typeof item.project === "string"
                                        ? item.project
                                        : item.project?.code ||
                                        item.project?.name}
                                    </Tag>
                                  </Space>
                                  <Text type="secondary" style={{ fontSize: 10, color: '#bfbfbf' }}>
                                    {formatTimeAgo(item.createdAt)}
                                  </Text>
                                </div>

                                <Text
                                  strong
                                  ellipsis={{ tooltip: item.title }}
                                  style={{
                                    fontSize: 13,
                                    display: "block",
                                    color: "#262626",
                                    lineHeight: 1.3,
                                    marginBottom: 6
                                  }}
                                >
                                  {item.title}
                                </Text>

                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                  }}
                                >
                                  {(() => {
                                    let color = "default";
                                    const status = item.status?.toLowerCase();
                                    if (status === "completed" || status === "live") color = "success";
                                    if (status === "in_progress") color = "processing";
                                    if (status === "not_started") color = "default";
                                    if (status === "blocked") color = "error";

                                    return (
                                      <Tag
                                        color={color}
                                        style={{
                                          fontSize: 9,
                                          margin: 0,
                                          borderRadius: "5px",
                                          padding: "0 8px",
                                          border: 'none',
                                          fontWeight: 600
                                        }}
                                      >
                                        {item.status?.replace(/_/g, " ").toUpperCase()}
                                      </Tag>
                                    );
                                  })()}

                                  {item.assignee && (
                                    <Tooltip title={`Assignee: ${item.assignee.name}`}>
                                      <Avatar
                                        size={20}
                                        src={item.assignee.avatar}
                                        style={{
                                          backgroundColor: "#722ed1",
                                          fontSize: 10,
                                          border: '1.5px solid white',
                                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                        }}
                                      >
                                        {item.assignee.name?.charAt(0).toUpperCase()}
                                      </Avatar>
                                    </Tooltip>
                                  )}
                                </div>
                              </div>
                            </List.Item>
                          )}
                        />
                      </Card>
                    </Col>
                  </Row>
                </>
              ) : null}
            </>
          )}

          {/* ✅ ORGANIZATION SEGMENT */}
          {activeSegment === "organization" && <Organization />}
        </div>
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
