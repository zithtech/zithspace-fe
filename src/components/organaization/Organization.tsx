"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { dashboardService, DashboardData } from "@/services/dashboardService";
import { useZohoCalendar } from "@/hooks/useZohoCalendar";
import { EmployeeService } from "@/services/employeeServices";
import {
  Card,
  Row,
  Col,
  Typography,
  Space,
  Avatar,
  Button,
  Alert,
  Skeleton,
  Tooltip,
  Empty,
  theme,
} from "antd";
import {
  TeamOutlined,
  ProjectOutlined,
  UserOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  CalendarOutlined,
  GiftOutlined,
  HomeOutlined,
  CoffeeOutlined,
  ArrowRightOutlined,
  RocketOutlined,
  BarChartOutlined,
  FireOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

const { Text } = Typography;

function DashboardContent() {
  const { token } = theme.useToken();
  const { user } = useAuth();
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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const selectedProject = dashboardData?.projectProgress.find(
    (p) => p.id === selectedProjectId,
  );

  // ─── Helpers ──────────────────────────────────────────────────────
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
          border: `1px solid ${accent ? `${accent}33` : token.colorBorderSecondary
            }`,
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
              fontSize: 13,
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
      styles={{ body: { padding: "12px 14px" } }}
      onClick={onClick}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            background: `${accent}14`,
            border: `1px solid ${accent}26`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: accent,
            fontSize: 17,
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
          <Text type="secondary" style={{ fontSize: 11, lineHeight: 1.3 }}>
            {desc}
          </Text>
        </div>
        <ArrowRightOutlined
          style={{ fontSize: 12, color: token.colorTextTertiary }}
        />
      </div>
    </Card>
  );

  // ─── Stats ────────────────────────────────────────────────────────
  const stats = dashboardData
    ? [
      {
        eyebrow: "Total Members",
        value: dashboardData.stats.totalMembers,
        trend: dashboardData.trends.memberGrowth,
        icon: <TeamOutlined />,
        accent: "#0EA5E9",
      },
      {
        eyebrow: "Active Projects",
        value: dashboardData.stats.activeProjects,
        trend: dashboardData.trends.projectGrowth,
        icon: <ProjectOutlined />,
        accent: "#7C3AED",
      },
      {
        eyebrow: "Tickets · Closed / Total",
        value: dashboardData.stats.tickets.display,
        trend: dashboardData.trends.ticketCompletionRate,
        icon: <TrophyOutlined />,
        accent: "#F59E0B",
      },
      {
        eyebrow: "Today's Attendance",
        value: `${dashboardData.stats.attendance.present} / ${dashboardData.stats.totalMembers}`,
        trend: `${dashboardData.stats.attendance.attendanceRate}% Present`,
        icon: <ClockCircleOutlined />,
        accent: "#10B981",
      },
    ]
    : [];

  // ─── Project Pulse render ─────────────────────────────────────────
  const renderProjectPulse = () => {
    if (!selectedProject) {
      return (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Text type="secondary" style={{ fontSize: 12 }}>
                No active projects
              </Text>
            }
          />
        </div>
      );
    }

    const {
      notStartedTickets,
      inProgressTickets,
      completedTickets,
      totalTickets,
      progress,
    } = selectedProject;

    const pct = (n: number) =>
      totalTickets > 0 ? Math.round((n / totalTickets) * 100) : 0;

    const segments = [
      {
        label: "Done",
        value: completedTickets,
        color: "#10B981",
      },
      {
        label: "Active",
        value: inProgressTickets,
        color: "#0EA5E9",
      },
      {
        label: "Pending",
        value: notStartedTickets,
        color: "#F59E0B",
      },
    ];

    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "12px 16px 14px",
        }}
      >
        {/* Hero row: completion % + count */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: 8,
            gap: 12,
          }}
        >
          <div>
            <Text
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.6px",
                textTransform: "uppercase",
                color: token.colorTextSecondary,
                display: "block",
              }}
            >
              Progress
            </Text>
            <span
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: token.colorText,
                letterSpacing: "-0.8px",
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
                background: `linear-gradient(135deg, ${token.colorPrimary} 0%, #7C3AED 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                marginTop: 2,
                display: "inline-block",
              }}
            >
              {progress}%
            </span>
          </div>
          <div style={{ textAlign: "right", paddingBottom: 4 }}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: token.colorText,
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1,
              }}
            >
              {completedTickets}
              <span
                style={{
                  color: token.colorTextTertiary,
                  fontWeight: 500,
                }}
              >
                {" "}
                / {totalTickets}
              </span>
            </div>
            <Text
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: token.colorTextSecondary,
                letterSpacing: "0.4px",
                textTransform: "uppercase",
              }}
            >
              Tickets
            </Text>
          </div>
        </div>

        {/* Segmented bar */}
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
                key={s.label}
                title={`${s.label}: ${s.value} (${pct(s.value)}%)`}
              >
                <div
                  style={{
                    flex: s.value,
                    background: s.color,
                    borderRadius: 999,
                    minWidth: 4,
                  }}
                />
              </Tooltip>
            ))}
        </div>

        {/* Status rows */}
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
              key={s.label}
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
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
    );
  };

  // ─── Today's Pulse render ─────────────────────────────────────────
  const renderTodayPulse = () => {
    if (!dashboardData?.todayLeaves) return null;
    const { onLeave, onPermission, workingFromHome } = dashboardData.todayLeaves;

    const sections = [
      {
        key: "leave",
        title: "On Leave",
        icon: <CoffeeOutlined />,
        accent: "#F43F5E",
        items: onLeave,
        format: (l: any) =>
          `${l.type.replace(/_/g, " ")} · ${l.duration} ${l.durationType === "HOURS" ? "hrs" : "days"
          }`,
      },
      {
        key: "permission",
        title: "Permission",
        icon: <ClockCircleOutlined />,
        accent: "#8B5CF6",
        items: onPermission,
        format: (l: any) => `${l.duration} hours`,
      },
      {
        key: "wfh",
        title: "Working from Home",
        icon: <HomeOutlined />,
        accent: "#10B981",
        items: workingFromHome,
        format: (l: any) => l.user.position || "Remote",
      },
    ];

    const totalCount =
      onLeave.length + onPermission.length + workingFromHome.length;

    if (totalCount === 0) {
      return (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
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
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: token.colorTextTertiary,
              marginBottom: 10,
            }}
          >
            <TeamOutlined style={{ fontSize: 22 }} />
          </div>
          <Text
            strong
            style={{
              fontSize: 13,
              color: token.colorText,
              display: "block",
              marginBottom: 2,
            }}
          >
            Everyone is in
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            No leave, permission, or WFH today
          </Text>
        </div>
      );
    }

    return (
      <div
        style={{
          flex: 1,
          padding: "10px 14px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          overflowY: "auto",
        }}
        className="no-scrollbar"
      >
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
              letterSpacing: "0.6px",
              textTransform: "uppercase",
              color: token.colorTextSecondary,
            }}
          >
            {totalCount} away today
          </Text>
        </div>

        {sections
          .filter((s) => s.items.length > 0)
          .map((s) => (
            <div key={s.key}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 18,
                    height: 18,
                    borderRadius: 6,
                    background: `${s.accent}14`,
                    border: `1px solid ${s.accent}26`,
                    color: s.accent,
                    fontSize: 10,
                  }}
                >
                  {s.icon}
                </span>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: token.colorText,
                    letterSpacing: "0.2px",
                  }}
                >
                  {s.title}
                </Text>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: s.accent,
                    background: `${s.accent}14`,
                    padding: "1px 6px",
                    borderRadius: 999,
                  }}
                >
                  {s.items.length}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                {s.items.slice(0, 3).map((leave: any) => (
                  <div
                    key={leave.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "5px 8px",
                      borderRadius: 8,
                      background: token.colorFillAlter,
                      border: `1px solid ${token.colorBorderSecondary}`,
                    }}
                  >
                    <Avatar
                      size={22}
                      style={{
                        backgroundColor: s.accent,
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      {leave.user.name[0].toUpperCase()}
                    </Avatar>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        strong
                        style={{
                          fontSize: 12,
                          color: token.colorText,
                          display: "block",
                          lineHeight: 1.2,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {leave.user.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 10,
                          color: token.colorTextTertiary,
                          fontWeight: 500,
                        }}
                      >
                        {s.format(leave)}
                      </Text>
                    </div>
                  </div>
                ))}
                {s.items.length > 3 && (
                  <Text
                    style={{
                      fontSize: 10,
                      color: token.colorTextTertiary,
                      fontWeight: 600,
                      paddingLeft: 4,
                    }}
                  >
                    +{s.items.length - 3} more
                  </Text>
                )}
              </div>
            </div>
          ))}
      </div>
    );
  };

  // ─── Birthdays render ─────────────────────────────────────────────
  const renderBirthdays = () => {
    if (birthdays.length === 0) {
      return (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "rgba(236, 72, 153, 0.10)",
              border: "1px solid rgba(236, 72, 153, 0.25)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#EC4899",
              marginBottom: 10,
            }}
          >
            <GiftOutlined style={{ fontSize: 22 }} />
          </div>
          <Text
            strong
            style={{
              fontSize: 13,
              color: token.colorText,
              display: "block",
              marginBottom: 2,
            }}
          >
            No birthdays this month
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            Check back soon
          </Text>
        </div>
      );
    }

    const today = dayjs().startOf("day");
    const sorted = [...birthdays].sort((a, b) => {
      const da = dayjs(a.dateOfBirth).year(today.year());
      const db = dayjs(b.dateOfBirth).year(today.year());
      const aDays = da.isBefore(today) ? da.add(1, "year").diff(today, "day") : da.diff(today, "day");
      const bDays = db.isBefore(today) ? db.add(1, "year").diff(today, "day") : db.diff(today, "day");
      return aDays - bDays;
    });

    const formatRelative = (dob: string) => {
      const d = dayjs(dob).year(today.year());
      const target = d.isBefore(today) ? d.add(1, "year") : d;
      const days = target.diff(today, "day");
      if (days === 0) return "Today 🎉";
      if (days === 1) return "Tomorrow";
      return `In ${days} days`;
    };

    return (
      <div
        style={{
          flex: 1,
          padding: "10px 12px 12px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
        className="no-scrollbar"
      >
        {sorted.map((emp, idx) => {
          const dob = dayjs(emp.dateOfBirth);
          const target = dob.year(today.year());
          const isToday = target.isSame(today, "day");
          return (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                borderRadius: 10,
                background: isToday
                  ? "rgba(236, 72, 153, 0.08)"
                  : token.colorFillAlter,
                border: isToday
                  ? "1px solid rgba(236, 72, 153, 0.3)"
                  : `1px solid ${token.colorBorderSecondary}`,
              }}
            >
              <Avatar
                size={32}
                style={{
                  backgroundColor: "#EC4899",
                  fontSize: 13,
                  fontWeight: 700,
                  border: `2px solid ${token.colorBgContainer}`,
                  boxShadow: "0 2px 4px rgba(236, 72, 153, 0.2)",
                }}
              >
                {(emp.firstName?.[0] || "?").toUpperCase()}
              </Avatar>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text
                  strong
                  style={{
                    fontSize: 12,
                    color: token.colorText,
                    display: "block",
                    lineHeight: 1.3,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {emp.firstName} {emp.lastName}
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    color: token.colorTextTertiary,
                    fontWeight: 500,
                  }}
                >
                  <GiftOutlined style={{ marginRight: 4, color: "#EC4899" }} />
                  {dob.format("MMM D")}
                </Text>
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.3px",
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: isToday
                    ? "rgba(236, 72, 153, 0.15)"
                    : token.colorBgContainer,
                  border: isToday
                    ? "1px solid rgba(236, 72, 153, 0.3)"
                    : `1px solid ${token.colorBorderSecondary}`,
                  color: isToday ? "#BE185D" : token.colorTextSecondary,
                  whiteSpace: "nowrap",
                }}
              >
                {formatRelative(emp.dateOfBirth)}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // ─── Recent Activities render ─────────────────────────────────────
  const renderActivities = () => {
    const items = dashboardData?.recentActivities || [];
    if (items.length === 0) {
      return (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
          }}
        >
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Text type="secondary" style={{ fontSize: 12 }}>
                No recent activities
              </Text>
            }
          />
        </div>
      );
    }

    return (
      <div
        style={{
          padding: "8px 0",
          flex: 1,
          overflowY: "auto",
          maxHeight: 320,
        }}
        className="no-scrollbar"
      >
        {items.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              gap: 12,
              padding: "10px 16px",
              borderBottom:
                idx === items.length - 1
                  ? "none"
                  : `1px dashed ${token.colorBorderSecondary}`,
            }}
          >
            {/* Timeline dot */}
            <div
              style={{
                position: "relative",
                width: 28,
                flexShrink: 0,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Avatar
                size={28}
                style={{
                  backgroundColor: token.colorPrimary,
                  fontSize: 11,
                  fontWeight: 700,
                  zIndex: 1,
                }}
              >
                {item.avatar}
              </Avatar>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{
                  fontSize: 12,
                  color: token.colorText,
                  display: "block",
                  lineHeight: 1.4,
                }}
              >
                <Text
                  strong
                  style={{ fontSize: 12, color: token.colorText }}
                >
                  {item.user}
                </Text>{" "}
                <Text
                  style={{ fontSize: 12, color: token.colorTextSecondary }}
                >
                  {item.action}
                </Text>{" "}
                <Text
                  strong
                  style={{ fontSize: 12, color: token.colorText }}
                >
                  {item.target}
                </Text>
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  color: token.colorTextTertiary,
                  fontWeight: 500,
                  letterSpacing: "0.2px",
                }}
              >
                {formatTimeAgo(item.time)}
              </Text>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
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
                  style={cardBase}
                  styles={{ body: { padding: "14px 16px" } }}
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
          {/* KPI Strip */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            {stats.map((s, i) => (
              <Col xs={24} sm={12} lg={6} key={i}>
                <KpiCard
                  eyebrow={s.eyebrow}
                  value={s.value}
                  trend={s.trend}
                  trendTone="positive"
                  icon={s.icon}
                  accent={s.accent}
                />
              </Col>
            ))}
          </Row>

          {/* Top Row: Project Pulse · Today's Pulse · Birthdays */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} lg={8}>
              <Card
                style={{ ...cardBase, height: 380 }}
                styles={{
                  body: {
                    padding: 0,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  },
                }}
                title={sectionTitle(
                  <ProjectOutlined />,
                  "Project Pulse",
                  "#7C3AED",
                )}
                extra={
                  <Space size={6}>
                    {dashboardData.projectProgress.length > 1 && (
                      <select
                        value={selectedProjectId || ""}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        style={{
                          padding: "3px 8px",
                          borderRadius: 8,
                          border: `1px solid ${token.colorBorderSecondary}`,
                          background: token.colorBgContainer,
                          color: token.colorText,
                          fontSize: 11,
                          fontWeight: 600,
                          maxWidth: 110,
                          cursor: "pointer",
                          outline: "none",
                        }}
                      >
                        {dashboardData.projectProgress.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    )}
                    <Button
                      type="link"
                      size="small"
                      onClick={() => router.push("/projects")}
                      style={{ fontSize: 11 }}
                    >
                      View
                    </Button>
                  </Space>
                }
              >
                {renderProjectPulse()}
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card
                style={{ ...cardBase, height: 380 }}
                styles={{
                  body: {
                    padding: 0,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  },
                }}
                title={sectionTitle(
                  <CalendarOutlined />,
                  "Today's Pulse",
                  "#0EA5E9",
                )}
                extra={
                  <Button
                    type="link"
                    size="small"
                    onClick={() => router.push("/leaves")}
                    style={{ fontSize: 11 }}
                  >
                    View All
                  </Button>
                }
              >
                {renderTodayPulse()}
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card
                style={{ ...cardBase, height: 380 }}
                styles={{
                  body: {
                    padding: 0,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  },
                }}
                title={sectionTitle(
                  <GiftOutlined />,
                  "Upcoming Birthdays",
                  "#EC4899",
                )}
              >
                {renderBirthdays()}
              </Card>
            </Col>
          </Row>

          {/* Bottom Row: Recent Activities + Team Insights */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card
                style={{ ...cardBase, height: "100%" }}
                styles={{
                  body: {
                    padding: 0,
                    display: "flex",
                    flexDirection: "column",
                  },
                }}
                title={sectionTitle(
                  <FireOutlined />,
                  "Recent Activities",
                  "#F59E0B",
                )}
                extra={
                  <Button type="link" size="small" style={{ fontSize: 11 }}>
                    View All
                  </Button>
                }
              >
                {renderActivities()}
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card
                style={cardBase}
                styles={{ body: { padding: 16 } }}
                title={sectionTitle(
                  <BarChartOutlined />,
                  "Team Insights",
                  "#10B981",
                )}
              >
                <Space
                  direction="vertical"
                  size={10}
                  style={{ width: "100%" }}
                >
                  <QuickActionCard
                    icon={<TeamOutlined />}
                    title="Members"
                    desc="Browse the entire roster"
                    accent="#0EA5E9"
                    onClick={() => router.push("/members")}
                  />
                  <QuickActionCard
                    icon={<RocketOutlined />}
                    title="Active Projects"
                    desc="See what teams are shipping"
                    accent="#7C3AED"
                    onClick={() => router.push("/projects")}
                  />
                  <QuickActionCard
                    icon={<CalendarOutlined />}
                    title="Leave Calendar"
                    desc="Plan around team availability"
                    accent="#10B981"
                    onClick={() => router.push("/leaves")}
                  />
                </Space>
              </Card>
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
