"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { dashboardService, DashboardData } from "@/services/dashboardService";
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
} from "@ant-design/icons";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;

export default function DashboardPage() {
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
      if (!user) return;

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
    };

    fetchDashboardData();
  }, [user]);

  // Show loading spinner while authentication is being checked
  if (authLoading) {
    return (
      <MainLayout>
        <LoadingSpinner message="Loading dashboard..." />
      </MainLayout>
    );
  }

  // Don't render if no user
  if (!user) {
    return null;
  }

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
      weekday: "long",
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
            height: 200,
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

    // We can use a conic-gradient for a simple, lightweight pie chart
    // Colors: Not Started (Gray #d9d9d9), In Progress (Blue #1677ff), Completed (Green #52c41a)
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
          padding: 16,
        }}
      >
        {/* Pie Chart */}
        <div
          style={{
            width: 180,
            height: 180,
            borderRadius: "50%",
            background: gradient,
            position: "relative",
            marginBottom: 24,
          }}
        >
          {/* Inner circle for Donut effect (optional, or just full pie) */}
          <div
            style={{
              position: "absolute",
              top: 35,
              left: 35,
              width: 110,
              height: 110,
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
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 12,
                height: 12,
                background: "#d9d9d9",
                borderRadius: "50%",
                margin: "0 auto 4px",
              }}
            />
            <div style={{ fontSize: 12, fontWeight: 600 }}>
              {notStartedTickets}
            </div>
            <div style={{ fontSize: 10, color: "#888" }}>Not Started</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 12,
                height: 12,
                background: "#1677ff",
                borderRadius: "50%",
                margin: "0 auto 4px",
              }}
            />
            <div style={{ fontSize: 12, fontWeight: 600 }}>
              {inProgressTickets}
            </div>
            <div style={{ fontSize: 10, color: "#888" }}>In Progress</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 12,
                height: 12,
                background: "#52c41a",
                borderRadius: "50%",
                margin: "0 auto 4px",
              }}
            />
            <div style={{ fontSize: 12, fontWeight: 600 }}>
              {completedTickets}
            </div>
            <div style={{ fontSize: 10, color: "#888" }}>Completed</div>
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
            message="Error Loading Dashboard"
            description={error}
            type="error"
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 24 }}
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
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
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
              {/* Left Column - Main Content (Projects & Activity) */}
              <Col xs={24} lg={16}>
                <Space direction="vertical" size={16} style={{ width: "100%" }}>
                  {/* SPLIT: Work Progress (Left) & Attendance Breakdown (Right) */}
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
                    styles={{ body: { padding: 16 } }}
                  >
                    <Row gutter={[24, 16]} key="work-progress-row">
                      {/* Left: Project Pie Chart */}
                      <Col
                        xs={24}
                        md={12}
                        style={{ borderRight: "1px solid #f0f0f0" }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 16,
                          }}
                        >
                          <Text strong style={{ fontSize: 13 }}>
                            Project Status
                          </Text>
                          <select
                            style={{
                              padding: "2px 6px",
                              borderRadius: 4,
                              border: "1px solid #d9d9d9",
                              outline: "none",
                              fontSize: 11,
                              maxWidth: 120,
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
                      </Col>

                      {/* Right: Team Performance Stats */}
                      <Col xs={24} md={12}>
                        <div style={{ textAlign: "center", marginBottom: 16 }}>
                          <Text strong style={{ fontSize: 13 }}>
                            Team Performance
                          </Text>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                            height: "100%",
                            justifyContent: "center",
                          }}
                        >
                          {/* Daily Updates */}
                          <div
                            style={{
                              background: "#f0f5ff",
                              border: "1px solid #adc6ff",
                              borderRadius: 8,
                              padding: 12,
                            }}
                          >
                            <Space style={{ width: "100%", justifyContent: "space-between" }}>
                              <Text style={{ fontSize: 12 }}>📝 Daily Updates</Text>
                              <Text strong style={{ color: "#1677ff" }}>
                                {dashboardData.teamPerformance.dailyUpdates.submitted} / {dashboardData.teamPerformance.dailyUpdates.total}
                              </Text>
                            </Space>
                          </div>

                          {/* Average Hours Worked */}
                          <div
                            style={{
                              background: "#f6ffed",
                              border: "1px solid #b7eb8f",
                              borderRadius: 8,
                              padding: 12,
                            }}
                          >
                            <Space style={{ width: "100%", justifyContent: "space-between" }}>
                              <Text style={{ fontSize: 12 }}>⏰ Avg Hours Worked</Text>
                              <Text strong style={{ color: "#52c41a" }}>
                                {dashboardData.teamPerformance.avgHoursWorked.toFixed(1)} hrs
                              </Text>
                            </Space>
                          </div>

                          {/* Top Performer */}
                          {dashboardData.teamPerformance.topPerformer && dashboardData.teamPerformance.topPerformer.user && (
                            <div
                              style={{
                                background: "#fff7e6",
                                border: "1px solid #ffd591",
                                borderRadius: 8,
                                padding: 12,
                              }}
                            >
                              <Text style={{ fontSize: 11, color: "#888" }}>🏆 Top Performer</Text>
                              <div style={{ marginTop: 4 }}>
                                <Text strong style={{ fontSize: 12 }}>
                                  {dashboardData.teamPerformance.topPerformer.user.name}
                                </Text>
                                <br />
                                <Text style={{ fontSize: 11, color: "#666" }}>
                                  {dashboardData.teamPerformance.topPerformer.completedTickets} tickets completed
                                </Text>
                              </div>
                            </div>
                          )}

                          {/* Late & Overtime */}
                          <Row gutter={8}>
                            <Col span={12}>
                              <div
                                style={{
                                  background: "#fff1f0",
                                  border: "1px solid #ffa39e",
                                  borderRadius: 8,
                                  padding: 8,
                                  textAlign: "center",
                                }}
                              >
                                <Text style={{ fontSize: 11 }}>⚠️ Late</Text>
                                <br />
                                <Text strong style={{ fontSize: 16, color: "#ff4d4f" }}>
                                  {dashboardData.teamPerformance.lateArrivals}
                                </Text>
                              </div>
                            </Col>
                            <Col span={12}>
                              <div
                                style={{
                                  background: "#f9f0ff",
                                  border: "1px solid #d3adf7",
                                  borderRadius: 8,
                                  padding: 8,
                                  textAlign: "center",
                                }}
                              >
                                <Text style={{ fontSize: 11 }}>💪 Overtime</Text>
                                <br />
                                <Text strong style={{ fontSize: 16, color: "#722ed1" }}>
                                  {dashboardData.teamPerformance.overtimeWorkers}
                                </Text>
                              </div>
                            </Col>
                          </Row>
                        </div>
                      </Col>
                    </Row>
                  </Card>

                  {/* Recent Activities */}
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

              {/* Right Column - Sidebar (Quick Actions & Tasks) */}
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
                          >
                            Meeting
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
