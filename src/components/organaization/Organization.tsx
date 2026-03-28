"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { dashboardService, DashboardData } from "@/services/dashboardService";
import { useZohoCalendar } from "@/hooks/useZohoCalendar";
import { EmployeeService } from "@/services/employeeServices";
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
  GiftOutlined,
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
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [birthdays, setBirthdays] = useState<any[]>([]);

  // Zoho Calendar Integration
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

    const fetchBirthdays = async () => {
      try {
        const data = await EmployeeService.getUpcomingBirthdays();
        setBirthdays(data);
      } catch (err) {
        console.error("Failed to fetch birthdays", err);
      }
    };
    fetchBirthdays();
  }, [user]);
  useEffect(() => {


  }, [dashboardData]);

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
        title: "Total Members",
        value: dashboardData.stats.totalMembers,
        icon: <TeamOutlined style={{ color: "#8c8c8c" }} />,
        color: "#1677ff",
        change: dashboardData.trends.memberGrowth,
      },
      {
        title: "Active Projects",
        value: dashboardData.stats.activeProjects,
        icon: <ProjectOutlined style={{ color: "#8c8c8c" }} />,
        color: "#1677ff",
        change: dashboardData.trends.projectGrowth,
      },
      {
        title: "Assigned / Closed Tickets",
        value: dashboardData.stats.tickets.display,
        icon: <UserOutlined style={{ color: "#8c8c8c" }} />,
        color: "#1677ff",
        change: dashboardData.trends.ticketCompletionRate,
      },
      {
        title: "Today's Attendance",
        value: `${dashboardData.stats.attendance.present} / ${dashboardData.stats.totalMembers}`,
        icon: <ClockCircleOutlined style={{ color: "#8c8c8c" }} />,
        color: "#1677ff",
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
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text type="secondary">No tickets in this project</Text>
        </div>
      );

    const notStartedDeg = (notStartedTickets / totalTickets) * 360;
    const inProgressDeg = (inProgressTickets / totalTickets) * 360;
    const completedDeg = (completedTickets / totalTickets) * 360;

    const gradient = `conic-gradient(
      #f0f0f0 0deg ${notStartedDeg}deg,
      #1677ff ${notStartedDeg}deg ${notStartedDeg + inProgressDeg}deg,
      #1677ff ${notStartedDeg + inProgressDeg}deg 360deg
    )`;

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          marginTop: -8,
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
            <div style={{ fontSize: 24, fontWeight: "bold", marginTop: -6 }}>
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
                background: "#f0f0f0",
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
                background: "#1677ff",
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
    <div>
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
                    height: "100%",
                    borderRadius: "16px",
                    border: "1px solid #f0f0f0",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
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

          <Row gutter={[16, 16]} style={{ display: "flex", alignItems: "stretch" }}>
            {/* Left Column - Main Content */}
            <Col xs={24} lg={16} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Row for Card 1 (Work & Attendance) and Card 2 (Colleagues Birthdays) - Side by Side */}
                <Row gutter={[16, 16]} style={{ width: "100%", margin: 0 }}>
                  {/* CARD 1: Work & Attendance with Project Status */}
                  <Col xs={24} md={12} style={{ display: "flex" }}>
                    <Card
                      title={
                        <Space>
                          <TrophyOutlined style={{ color: "#8c8c8c" }} />
                          <span style={{ fontSize: 15, fontWeight: 600 }}>Work & Attendance</span>
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
                      styles={{ body: { padding: 12, flex: 1 } }}
                      style={{
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        borderRadius: "16px",
                        border: "1px solid #f0f0f0",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
                      }}
                    >
                      {/* Project Status inside Work & Attendance card */}
                      <div style={{ height: "100%" }}>
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
                            onChange={(e) =>
                              setSelectedProjectId(e.target.value)
                            }
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

                  {/* CARD 2: Colleagues Birthdays */}
                  <Col xs={24} md={12} style={{ display: "flex" }}>
                    <Card
                      title={
                        <Space>
                          <GiftOutlined style={{ color: "#8c8c8c" }} />
                          <span style={{ fontSize: 15, fontWeight: 600 }}>Colleagues Birthdays</span>
                        </Space>
                      }
                      size="small"
                      styles={{ body: { padding: 0, flex: 1, overflowY: "auto" } }}
                      style={{
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        borderRadius: "16px",
                        border: "1px solid #f0f0f0",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
                      }}
                    >
                      <div style={{ overflowY: "auto", height: "100%" }}>
                        {birthdays.length > 0 ? (
                          <List
                            size="small"
                            dataSource={birthdays}
                            renderItem={(emp) => (
                              <List.Item
                                style={{
                                  padding: "12px 16px",
                                  borderBottom: "1px solid #f0f0f0",
                                }}
                              >
                                <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                                  <Space>
                                    <Avatar
                                      style={{ backgroundColor: "#eb2f96" }}
                                      icon={<UserOutlined />}
                                    />
                                    <Text strong style={{ fontSize: 13 }}>
                                      {emp.firstName} {emp.lastName}
                                    </Text>
                                  </Space>
                                  <Text style={{ fontSize: 12, color: "#888", fontWeight: 500 }}>
                                    <GiftOutlined style={{ marginRight: 6, color: "#eb2f96" }} />
                                    {new Date(emp.dateOfBirth).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </Text>
                                </div>
                              </List.Item>
                            )}
                          />
                        ) : (
                          <div
                            style={{
                              height: "280px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              No birthdays this month
                            </Text>
                          </div>
                        )}
                      </div>
                    </Card>
                  </Col>
                </Row>

                {/* CARD 3: Recent Activities */}
                <Row style={{ width: "100%", margin: 0, flex: 1 }}>
                  <Col xs={24} style={{ display: "flex" }}>
                    <Card
                      title={
                        <Space>
                          <ClockCircleOutlined style={{ color: "#8c8c8c" }} />
                          <span style={{ fontSize: 15, fontWeight: 600 }}>Recent Activities</span>
                        </Space>
                      }
                      size="small"
                      extra={
                        <Button type="link" size="small">
                          View All
                        </Button>
                      }
                      styles={{ body: { padding: 0 } }}
                      style={{
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        borderRadius: "16px",
                        border: "1px solid #f0f0f0",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
                      }}
                    >
                      <div style={{ overflowY: "auto", height: "300px" }}>
                        {dashboardData.recentActivities.length > 0 ? (
                          <List
                            size="small"
                            dataSource={dashboardData.recentActivities}
                            renderItem={(item) => (
                              <List.Item
                                style={{
                                  padding: "8px 12px",
                                  border: "none",
                                  borderBottom: "1px solid #f0f0f0",
                                }}
                              >
                                <List.Item.Meta
                                  avatar={
                                    <Avatar
                                      size={24}
                                      style={{
                                        backgroundColor: "#1677ff",
                                        fontSize: 10,
                                        fontWeight: 600,
                                      }}
                                    >
                                      {item.avatar}
                                    </Avatar>
                                  }
                                  title={
                                    <Text style={{ fontSize: 11 }}>
                                      <Text strong style={{ fontSize: 11 }}>
                                        {item.user}
                                      </Text>{" "}
                                      {item.action}{" "}
                                      <Text strong style={{ fontSize: 11 }}>
                                        {item.target}
                                      </Text>
                                    </Text>
                                  }
                                  description={
                                    <Text
                                      type="secondary"
                                      style={{ fontSize: 10 }}
                                    >
                                      {formatTimeAgo(item.time)}
                                    </Text>
                                  }
                                />
                              </List.Item>
                            )}
                          />
                        ) : (
                          <div
                            style={{
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              minHeight: 220
                            }}
                          >
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              No recent activities
                            </Text>
                          </div>
                        )}
                      </div>
                    </Card>
                  </Col>
                </Row>
            </Col>

            {/* Right Column - Sidebar */}
            <Col xs={24} lg={8} style={{ display: "flex" }}>
                {/* People on Leave & Permission Today — top position in sidebar */}
                {dashboardData.todayLeaves && (
                  <Card
                    title={
                      <Space>
                        <CalendarOutlined style={{ color: "#8c8c8c" }} />
                        <span style={{ fontSize: 15, fontWeight: 600 }}>People on Leave Today</span>
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
                    styles={{ body: { padding: 16, flex: 1, overflowY: "auto" } }}
                    style={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      borderRadius: "16px",
                      border: "1px solid #f0f0f0",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
                    }}
                  >
                    <Space
                      direction="vertical"
                      size={12}
                      style={{ width: "100%" }}
                    >
                      {/* On Leave */}
                      {dashboardData.todayLeaves.onLeave.length > 0 && (
                        <>
                          <div>
                            <Text
                              strong
                              style={{ fontSize: 12, color: "#1677ff" }}
                            >
                              🏖️ On Leave (
                              {dashboardData.todayLeaves.onLeave.length})
                            </Text>
                          </div>
                          <div style={{ maxHeight: 150, overflowY: "auto" }}>
                            {dashboardData.todayLeaves.onLeave
                              .slice(0, 3)
                              .map((leave) => (
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
                                    <Avatar
                                      size="small"
                                      style={{ backgroundColor: "#1677ff" }}
                                    >
                                      {leave.user.name[0]}
                                    </Avatar>
                                    <div>
                                      <Text strong style={{ fontSize: 11 }}>
                                        {leave.user.name}
                                      </Text>
                                      <br />
                                      <Text
                                        style={{ fontSize: 10, color: "#666" }}
                                      >
                                        {leave.type.replace(/_/g, " ")} •{" "}
                                        {leave.duration}{" "}
                                        {leave.durationType === "HOURS"
                                          ? "hrs"
                                          : "days"}
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
                            <Text
                              strong
                              style={{ fontSize: 12, color: "#722ed1" }}
                            >
                              ⏰ On Permission (
                              {dashboardData.todayLeaves.onPermission.length})
                            </Text>
                          </div>
                          <div style={{ maxHeight: 100, overflowY: "auto" }}>
                            {dashboardData.todayLeaves.onPermission
                              .slice(0, 3)
                              .map((leave) => (
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
                                    <Avatar
                                      size="small"
                                      style={{ backgroundColor: "#722ed1" }}
                                    >
                                      {leave.user.name[0]}
                                    </Avatar>
                                    <div>
                                      <Text strong style={{ fontSize: 11 }}>
                                        {leave.user.name}
                                      </Text>
                                      <br />
                                      <Text
                                        style={{ fontSize: 10, color: "#666" }}
                                      >
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
                            <Text
                              strong
                              style={{ fontSize: 12, color: "#52c41a" }}
                            >
                              🏠 Working From Home (
                              {dashboardData.todayLeaves.workingFromHome.length}
                              )
                            </Text>
                          </div>
                          <div style={{ maxHeight: 100, overflowY: "auto" }}>
                            {dashboardData.todayLeaves.workingFromHome
                              .slice(0, 3)
                              .map((leave) => (
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
                                    <Avatar
                                      size="small"
                                      style={{ backgroundColor: "#52c41a" }}
                                    >
                                      {leave.user.name[0]}
                                    </Avatar>
                                    <div>
                                      <Text strong style={{ fontSize: 11 }}>
                                        {leave.user.name}
                                      </Text>
                                      <br />
                                      <Text
                                        style={{ fontSize: 10, color: "#666" }}
                                      >
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
                        dashboardData.todayLeaves.workingFromHome.length ===
                        0 && (
                          <div
                            style={{ textAlign: "center", padding: "20px 0" }}
                          >
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              No one on leave or permission today
                            </Text>
                          </div>
                        )}
                    </Space>
                  </Card>
                )}
            </Col>
          </Row>
        </>
      ) : null}
    </div>
  );
}

export default function Organization() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading dashboard..." />}>
      <DashboardContent />
    </Suspense>
  );
}