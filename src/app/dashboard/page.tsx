
"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { dashboardService, DashboardData } from "@/services/dashboardService";
import { useDynamicCalendar } from "@/hooks/useDynamicCalendar";
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
} from "@ant-design/icons";
import { redirect, useRouter } from "next/navigation";
import dayjs from "dayjs";

const { Title, Text } = Typography;

function DashboardContent() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );

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
  } = useDynamicCalendar();

  // Filter today's meetings with recurring support
  const todaysMeetings = calendarEvents.reduce((acc: any[], event: any) => {
    console.log(`[Dashboard] Processing event:`, {
      title: event.title,
      startTime: event.startTime,
      endTime: event.endTime,
      isRecurring: event.isRecurring,
      rrule: event.rrule,
      attendees: event.attendees,
      userId: event.userId,
      userEmail: user?.email
    });

    // Filter: User must be an attendee or the creator
    const isUserAttendee = event.attendees?.includes(user?.email) || event.userId === user?.id;
    console.log(`[Dashboard] User attendee check:`, { isUserAttendee, userEmail: user?.email, eventAttendees: event.attendees });
    if (!isUserAttendee) return acc;

    const today = dayjs().startOf('day');
    const start = dayjs(event.startTime);
    const end = dayjs(event.endTime);
    const exdates = Array.isArray(event.exdate) ? event.exdate : (event.exdate ? [event.exdate] : []);

    // 1. Direct match
    if (start.isSame(today, 'day')) {
     const isExcluded = exdates.some((ex: string) =>
  dayjs(ex).isSame(today, "day")
);
      if (!isExcluded) acc.push(event);
      return acc;
    }

    // 2. Recurring match
    if (event.isRecurring && event.rrule && start.isBefore(today.endOf('day'))) {
      const isExcluded = exdates.some((ex: string) =>
  dayjs(ex).isSame(today, "day")
);
      if (isExcluded) return acc;

      let isMatch = false;
      if (event.rrule.includes('FREQ=DAILY')) {
        isMatch = true;
      } else if (event.rrule.includes('FREQ=WEEKLY')) {
        const dayMap: Record<string, number> = { 'SU': 0, 'MO': 1, 'TU': 2, 'WE': 3, 'TH': 4, 'FR': 5, 'SA': 6 };
        const match = event.rrule.match(/BYDAY=([^;]+)/);
        if (match) {
          const days = match[1].split(',');
          isMatch = days.some((d: string) => dayMap[d] === today.day());
        } else {
          isMatch = start.day() === today.day();
        }
      }

      if (isMatch) {
        // Clone event with today's date for display
        const duration = end.diff(start);
        const occurrenceStart = today.hour(start.hour()).minute(start.minute()).second(start.second());
        const occurrenceEnd = occurrenceStart.add(duration, 'ms');

        acc.push({
          ...event,
          startTime: occurrenceStart.toISOString(),
          endTime: occurrenceEnd.toISOString()
        });
      }
    }
    return acc;
  }, []);

  // Upcoming meetings (next 7 days)
  const upcomingMeetings = calendarEvents.filter(event => {
    // Filter: User must be an attendee or the creator
    const isUserAttendee = event.attendees?.includes(user?.email) || event.userId === user?.id;
    if (!isUserAttendee) return false;

    const eventDate = dayjs(event.startTime);
    const today = dayjs().startOf('day');
    const nextWeek = today.add(7, 'day');
    return eventDate.isAfter(today) && eventDate.isBefore(nextWeek);
  }).sort((a, b) => dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf());

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
    (p) => p.id === selectedProjectId
  );

  // Statistics cards configuration
  const stats = dashboardData
    ? [
      {
        title: "Total Members",
        value: dashboardData.stats.totalMembers,
        icon: <TeamOutlined style={{ color: "#1677ff" }} />,
        color: "#1677ff",
        change: dashboardData.trends.memberGrowth,
      },
      {
        title: "Active Projects",
        value: dashboardData.stats.activeProjects,
        icon: <ProjectOutlined style={{ color: "#52c41a" }} />,
        color: "#52c41a",
        change: dashboardData.trends.projectGrowth,
      },
      {
        title: "Assigned Tickets / Closed Tickets",
        value: dashboardData.stats.tickets.display,
        icon: <UserOutlined style={{ color: "#faad14" }} />,
        color: "#faad14",
        change: dashboardData.trends.ticketCompletionRate,
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

  // Pie Chart Helper
  const renderPieChart = (project: typeof selectedProject) => {
    if (!project) return null;
    const {
      notStartedTickets,
      inProgressTickets,
      completedTickets,
      totalTickets,
    } = project;

    if (totalTickets === 0)
      return (
        <div
          style={{
            height: '100%',
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text type="secondary">No tickets in this project</Text>
        </div>
      );

    // Calculate angles
    const notStartedDeg = (notStartedTickets / totalTickets) * 360;
    const inProgressDeg = (inProgressTickets / totalTickets) * 360;
    const completedDeg = (completedTickets / totalTickets) * 360;

    const gradient = `conic-gradient(
      #d9d9d9 0deg ${notStartedDeg}deg,
      #1677ff ${notStartedDeg}deg ${notStartedDeg + inProgressDeg}deg,
      #52c41a ${notStartedDeg + inProgressDeg}deg 360deg
    )`;

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          //padding: 16,
          justifyContent: 'center',
        height: '100%',
        }}
      >
        {/* Pie Chart */}
        <div
          style={{
            width: 130,
            height: 130,
            borderRadius: "50%",
            background: gradient,
            position: "relative",
            marginBottom: 16,
          }}
        >
          {/* Inner circle for Donut effect */}
          <div
            style={{
              position: "absolute",
              top: 22,
              left: 22,
              width: 86,
              height: 86,
              borderRadius: "50%",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
            }}
          >
            <div style={{ fontSize: 24, fontWeight: "bold" }}>
              {project.progress}%
            </div>
            <div style={{ fontSize: 12, color: "#888" }}>Complete</div>
          </div>
        </div>

        {/* Legend */}
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-around",
            flexWrap: "nowrap",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 8,
                height: 8,
                background: "#d9d9d9",
                borderRadius: "50%",
                margin: "0 auto 2px",
              }}
            />
            <div style={{ fontSize: 10, fontWeight: 600 }}>
              {notStartedTickets}
            </div>
            <div style={{ fontSize: 8, color: "#888" }}>Not Started</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 8,
                height: 8,
                background: "#1677ff",
                borderRadius: "50%",
                margin: "0 auto 2px",
              }}
            />
            <div style={{ fontSize: 10, fontWeight: 600 }}>
              {inProgressTickets}
            </div>
            <div style={{ fontSize: 8, color: "#888" }}>In Progress</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 8,
                height: 8,
                background: "#52c41a",
                borderRadius: "50%",
                margin: "0 auto 4px",
              }}
            />
            <div style={{ fontSize: 10, fontWeight: 600 }}>
              {completedTickets}
            </div>
            <div style={{ fontSize: 8, color: "#888" }}>Completed</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <MainLayout>
      <div style={{ padding: 20 }}>
        {/* Welcome Header */}
        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0, color: "#262626" }}>
            Welcome back, {user?.name}!
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Here&apos;s what&apos;s happening with your projects today.
          </Text>
        </div>

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
              {stats.map((stat, index) => (
                <Col xs={24} sm={12} lg={6} key={index}>
                  <Card
                    size="small"
                    style={{
                      borderLeft: `4px solid ${stat.color}`,
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
                          value={stat.value}
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

            <Row gutter={[16, 16]}>


              {/* Left Column - Main Content */}
<Col xs={24} lg={16}>
  <Space direction="vertical" size={16} style={{ width: "100%" }}>
    
    {/* Row for Card 1 and Card 2 - Side by Side with equal height */}
    <Row gutter={[16, 16]}>
      {/* CARD 1: Work & Attendance with Project Status - REDUCED HEIGHT */}
      <Col xs={24} md={12}>
        <Card
          title={
            <Space>
              <TrophyOutlined style={{ color: "#1677ff" }} />
              <span>Work & Attendance</span>
            </Space>
          }
          size="small"
          extra={
            <Button
              type="link"
              size="small"
              onClick={() => router.push("/projects")}
            >
              View Projects
            </Button>
          }
          styles={{ body: { padding: 12 } }}
          style={{ height: '280px' }}
        >
          {/* Project Status inside Work & Attendance card */}
          <div style={{ height: '100%' }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Text strong style={{ fontSize: 12 }}>
                Project Status
              </Text>
              <select
                style={{
                  padding: "2px 4px",
                  borderRadius: 4,
                  border: "1px solid #d9d9d9",
                  outline: "none",
                  fontSize: 10,
                  maxWidth: 100,
                  cursor: "pointer",
                }}
                value={selectedProjectId || ""}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                {dashboardData.projectProgress.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            {selectedProject ? (
              renderPieChart(selectedProject)
            ) : (
              <div
                style={{
                  height: 180,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text type="secondary">No active projects</Text>
              </div>
            )}
          </div>
        </Card>
      </Col>

      {/* CARD 2: Today's Meetings - REDUCED HEIGHT */}
      <Col xs={24} md={12}>
        <Card
          title={
            <Space size={4}>
              <VideoCameraOutlined style={{ color: "#1677ff", fontSize: 14 }} />
              <span style={{ fontSize: 13 }}>Today's Meetings</span>
              {!calendarStatus?.includes('connected') && (
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
            calendarStatus?.includes('connected') && (
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
          ) : !calendarStatus?.includes('connected') ? (
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
      </Col>
    </Row>

    {/* CARD 3: Recent Activities - Full width below */}
    <Card
      title={
        <Space>
          <ClockCircleOutlined style={{ color: "#52c41a" }} />
          <span>Recent Activities</span>
        </Space>
      }
      size="small"
      extra={
        <Button type="link" size="small">
          View All
        </Button>
      }
      styles={{ body: { padding: 0 } }}
    >
      <div style={{ maxHeight: 400, overflowY: "auto" }}>
        {dashboardData.recentActivities.length > 0 ? (
          <List
            size="small"
            dataSource={dashboardData.recentActivities}
            renderItem={(item) => (
              <List.Item
                style={{ padding: "12px 16px", border: "none" }}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      size={32}
                      style={{
                        backgroundColor: "#1677ff",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {item.avatar}
                    </Avatar>
                  }
                  title={
                    <Text style={{ fontSize: 13 }}>
                      <Text strong>{item.user}</Text>{" "}
                      {item.action}{" "}
                      <Text strong>{item.target}</Text>
                    </Text>
                  }
                  description={
                    <Text
                      type="secondary"
                      style={{ fontSize: 11 }}
                    >
                      {formatTimeAgo(item.time)}
                    </Text>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <div style={{ padding: 16 }}>
            <Text type="secondary">No recent activities</Text>
          </div>
        )}
      </div>
    </Card>
  </Space>
</Col>

              {/* Right Column - Sidebar */}
              <Col xs={24} lg={8}>
                <Space direction="vertical" size={16} style={{ width: "100%" }}>
                  {/* People on Leave & Permission Today */}
                  {dashboardData.todayLeaves && (
                    <Card
                      title={
                        <Space>
                          <CalendarOutlined style={{ color: "#faad14" }} />
                          <span>People on Leave & Permission Today</span>
                        </Space>
                      }
                      size="small"
                      extra={
                        <Button
                          type="link"
                          size="small"
                          onClick={() => router.push("/leaves")}
                        >
                          View All
                        </Button>
                      }
                      styles={{ body: { padding: 16 } }}
                    >
                      <Space direction="vertical" size={12} style={{ width: "100%" }}>
                        {/* On Leave */}
                        {dashboardData.todayLeaves.onLeave.length > 0 && (
                          <>
                            <div>
                              <Text strong style={{ fontSize: 12, color: "#1677ff" }}>
                                🏖️ On Leave ({dashboardData.todayLeaves.onLeave.length})
                              </Text>
                            </div>
                            <div style={{ maxHeight: 150, overflowY: "auto" }}>
                              {dashboardData.todayLeaves.onLeave.slice(0, 3).map((leave) => (
                                <div
                                  key={leave.id}
                                  style={{
                                    padding: "8px",
                                    background: "#f0f5ff",
                                    borderRadius: 6,
                                    marginBottom: 8,
                                  }}
                                >
                                  <Space>
                                    <Avatar size="small" style={{ backgroundColor: "#1677ff" }}>
                                      {leave.user.name[0]}
                                    </Avatar>
                                    <div>
                                      <Text strong style={{ fontSize: 11 }}>
                                        {leave.user.name}
                                      </Text>
                                      <br />
                                      <Text style={{ fontSize: 10, color: "#666" }}>
                                        {leave.type.replace(/_/g, " ")} • {leave.duration} {leave.durationType === "HOURS" ? "hrs" : "days"}
                                      </Text>
                                    </div>
                                  </Space>
                                </div>
                              ))}
                            </div>
                          </>
                        )}

                        {/* On Permission */}
                        {dashboardData.todayLeaves.onPermission.length > 0 && (
                          <>
                            <Divider style={{ margin: "8px 0" }} />
                            <div>
                              <Text strong style={{ fontSize: 12, color: "#722ed1" }}>
                                ⏰ On Permission ({dashboardData.todayLeaves.onPermission.length})
                              </Text>
                            </div>
                            <div style={{ maxHeight: 100, overflowY: "auto" }}>
                              {dashboardData.todayLeaves.onPermission.slice(0, 3).map((leave) => (
                                <div
                                  key={leave.id}
                                  style={{
                                    padding: "8px",
                                    background: "#f9f0ff",
                                    borderRadius: 6,
                                    marginBottom: 8,
                                  }}
                                >
                                  <Space>
                                    <Avatar size="small" style={{ backgroundColor: "#722ed1" }}>
                                      {leave.user.name[0]}
                                    </Avatar>
                                    <div>
                                      <Text strong style={{ fontSize: 11 }}>
                                        {leave.user.name}
                                      </Text>
                                      <br />
                                      <Text style={{ fontSize: 10, color: "#666" }}>
                                        {leave.duration} hours
                                      </Text>
                                    </div>
                                  </Space>
                                </div>
                              ))}
                            </div>
                          </>
                        )}

                        {/* Working From Home */}
                        {dashboardData.todayLeaves.workingFromHome.length > 0 && (
                          <>
                            <Divider style={{ margin: "8px 0" }} />
                            <div>
                              <Text strong style={{ fontSize: 12, color: "#52c41a" }}>
                                🏠 Working From Home ({dashboardData.todayLeaves.workingFromHome.length})
                              </Text>
                            </div>
                            <div style={{ maxHeight: 100, overflowY: "auto" }}>
                              {dashboardData.todayLeaves.workingFromHome.slice(0, 3).map((leave) => (
                                <div
                                  key={leave.id}
                                  style={{
                                    padding: "8px",
                                    background: "#f6ffed",
                                    borderRadius: 6,
                                    marginBottom: 8,
                                  }}
                                >
                                  <Space>
                                    <Avatar size="small" style={{ backgroundColor: "#52c41a" }}>
                                      {leave.user.name[0]}
                                    </Avatar>
                                    <div>
                                      <Text strong style={{ fontSize: 11 }}>
                                        {leave.user.name}
                                      </Text>
                                      <br />
                                      <Text style={{ fontSize: 10, color: "#666" }}>
                                        {leave.user.position}
                                      </Text>
                                    </div>
                                  </Space>
                                </div>
                              ))}
                            </div>
                          </>
                        )}

                        {/* Empty State */}
                        {dashboardData.todayLeaves.onLeave.length === 0 &&
                          dashboardData.todayLeaves.onPermission.length === 0 &&
                          dashboardData.todayLeaves.workingFromHome.length === 0 && (
                            <div style={{ textAlign: "center", padding: "20px 0" }}>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                No one on leave or permission today
                              </Text>
                            </div>
                          )}
                      </Space>
                    </Card>
                  )}

                  {/* Quick Actions */}
                  <Card
                    title={
                      <Space>
                        <BellOutlined style={{ color: "#722ed1" }} />
                        <span>Quick Actions</span>
                      </Space>
                    }
                    size="small"
                    styles={{ body: { padding: 16 } }}
                  >
                    <Space
                      direction="vertical"
                      size={8}
                      style={{ width: "100%" }}
                    >
                      <Button
                        type="primary"
                        block
                        icon={<PlusOutlined />}
                        size="middle"
                        onClick={() => router.push("/projects/create")}
                      >
                        Create New Project
                      </Button>
                      <Button
                        block
                        icon={<TeamOutlined />}
                        size="middle"
                        onClick={() => router.push("/members")}
                      >
                        Add Team Member
                      </Button>
                      <Button
                        block
                        icon={<UserOutlined />}
                        size="middle"
                        onClick={() => router.push("/clients")}
                      >
                        Add New Client
                      </Button>
                      <Divider style={{ margin: "12px 0" }} />
                      <Row gutter={8}>
                        <Col span={12}>
                          <Button
                            type="dashed"
                            block
                            icon={<CalendarOutlined />}
                            size="small"
                            style={{ height: "auto", padding: "8px 4px" }}
                            onClick={() => router.push("/calendar")}
                          >
                            Schedule Meeting
                          </Button>
                        </Col>
                        <Col span={12}>
                          <Button
                            type="dashed"
                            block
                            icon={<ClockCircleOutlined />}
                            size="small"
                            style={{ height: "auto", padding: "8px 4px" }}
                            onClick={() => router.push("/attendance")}
                          >
                            Attendance
                          </Button>
                        </Col>
                      </Row>

                      {/* Leave Management Section */}
                      {dashboardData.leaves && (
                        <>
                          <Divider style={{ margin: "12px 0" }}>
                            Leave Management
                          </Divider>
                          <Space
                            direction="vertical"
                            size={8}
                            style={{ width: "100%" }}
                          >
                            {dashboardData.leaves.pendingApprovals > 0 && (
                              <Button
                                block
                                icon={<FileTextOutlined />}
                                size="middle"
                                onClick={() => router.push("/leaves")}
                                style={{
                                  borderColor: "#faad14",
                                  color: "#faad14",
                                }}
                              >
                                <Space
                                  style={{
                                    width: "100%",
                                    justifyContent: "space-between",
                                  }}
                                >
                                  <span>Pending Approvals</span>
                                  <Badge
                                    count={
                                      dashboardData.leaves.pendingApprovals
                                    }
                                    style={{ backgroundColor: "#faad14" }}
                                  />
                                </Space>
                              </Button>
                            )}

                            <Card
                              size="small"
                              style={{
                                backgroundColor: "#f0f5ff",
                                border: "1px solid #adc6ff",
                              }}
                            >
                              <Space
                                direction="vertical"
                                size={4}
                                style={{ width: "100%" }}
                              >
                                <Text strong style={{ fontSize: 12 }}>
                                  My Leaves This Month
                                </Text>
                                <Row gutter={8}>
                                  <Col span={8}>
                                    <Statistic
                                      title={
                                        <Text style={{ fontSize: 10 }}>
                                          Approved
                                        </Text>
                                      }
                                      value={
                                        dashboardData.leaves.myLeaves.approved
                                      }
                                      valueStyle={{
                                        fontSize: 16,
                                        color: "#52c41a",
                                      }}
                                    />
                                  </Col>
                                  <Col span={8}>
                                    <Statistic
                                      title={
                                        <Text style={{ fontSize: 10 }}>
                                          Pending
                                        </Text>
                                      }
                                      value={
                                        dashboardData.leaves.myLeaves.pending
                                      }
                                      valueStyle={{
                                        fontSize: 16,
                                        color: "#faad14",
                                      }}
                                    />
                                  </Col>
                                  <Col span={8}>
                                    <Statistic
                                      title={
                                        <Text style={{ fontSize: 10 }}>
                                          Days
                                        </Text>
                                      }
                                      value={
                                        dashboardData.leaves.myLeaves.totalDays
                                      }
                                      valueStyle={{
                                        fontSize: 16,
                                        color: "#1677ff",
                                      }}
                                    />
                                  </Col>
                                </Row>
                              </Space>
                            </Card>

                            <Button
                              type="dashed"
                              block
                              icon={<PlusOutlined />}
                              size="small"
                              onClick={() => router.push("/leaves")}
                            >
                              Apply for Leave
                            </Button>
                          </Space>
                        </>
                      )}
                    </Space>
                  </Card>



                  {/* Upcoming Tasks */}
                  <Card
                    title={
                      <Space>
                        <CalendarOutlined style={{ color: "#faad14" }} />
                        <span>Upcoming Tasks</span>
                      </Space>
                    }
                    size="small"
                    extra={
                      <Button
                        type="link"
                        size="small"
                        onClick={() => router.push("/tickets")}
                      >
                        View Calendar
                      </Button>
                    }
                    styles={{ body: { padding: 0 } }}
                  >
                    <div style={{ maxHeight: 400, overflowY: "auto" }}>
                      {dashboardData.upcomingTasks.length > 0 ? (
                        <List
                          size="small"
                          dataSource={dashboardData.upcomingTasks}
                          renderItem={(item) => (
                            <List.Item
                              style={{ padding: "12px 16px", border: "none" }}
                              actions={[
                                <Tag
                                  key="priority"
                                  color={getPriorityColor(item.priority)}
                                  style={{ fontSize: 10, margin: 0 }}
                                >
                                  {item.priority.toUpperCase()}
                                </Tag>,
                              ]}
                            >
                              <List.Item.Meta
                                title={
                                  <Text strong style={{ fontSize: 13 }}>
                                    {item.title}
                                  </Text>
                                }
                                description={
                                  <Text
                                    type="secondary"
                                    style={{ fontSize: 11 }}
                                  >
                                    <ClockCircleOutlined
                                      style={{ marginRight: 4 }}
                                    />
                                    {formatDueDate(item.time)}
                                  </Text>
                                }
                              />
                            </List.Item>
                          )}
                        />
                      ) : (
                        <div style={{ padding: 16 }}>
                          <Text type="secondary">No upcoming tasks</Text>
                        </div>
                      )}
                    </div>
                  </Card>
                </Space>
              </Col>
            </Row>
          </>
        ) : null}
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
