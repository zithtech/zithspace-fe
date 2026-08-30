"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { dashboardService, DashboardData } from "@/services/dashboardService";
import { useZohoCalendar } from "@/hooks/useZohoCalendar";
import { EmployeeService } from "@/services/employeeServices";
import LeaveV2Service from "@/services/leaveV2Service";
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
  Select,
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
import ZukvoLoader from "../common/ZukvoLoader";

const { Text } = Typography;

function DashboardContent({ dashboardSettings }: { dashboardSettings?: any }) {
  const { token } = theme.useToken();
  const { user, hasAnySubscriptionFeature } = useAuth();
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
  const [localLeaves, setLocalLeaves] = useState<any[]>([]);

  // Zoho Calendar Integration
  const {
    error: calendarError,
    successMessage: calendarSuccess,
  } = useZohoCalendar();

  const isMetricTotalMembersVisible = dashboardSettings?.metricTotalMembers !== false && hasAnySubscriptionFeature("admin_members");
  const isMetricActiveProjectsVisible = dashboardSettings?.metricActiveProjects !== false && hasAnySubscriptionFeature("work_projects");
  const isMetricOrgTicketsVisible = dashboardSettings?.metricOrgTickets !== false && hasAnySubscriptionFeature("work_projects");
  const isMetricOrgTeamTodayVisible = dashboardSettings?.metricOrgTeamToday !== false && hasAnySubscriptionFeature("hrms_attendance", "my_hub_my_hub_general_attendance");

  const isCardProjectPulseVisible = dashboardSettings?.cardProjectPulse !== false && hasAnySubscriptionFeature("work_projects");
  const isUpcomingBirthdaysVisible = dashboardSettings?.upcomingBirthdays !== false;
  const isCardTodayLeavesVisible = dashboardSettings?.cardTodayLeaves !== false && hasAnySubscriptionFeature("hrms_leaves", "my_hub_my_hub_general_leaves");
  const isCardRecentActivitiesVisible = dashboardSettings?.cardRecentActivities !== false;

  useEffect(() => {
    if (dashboardSettings?.cardTodayLeaves !== false) {
      const fetchLocalLeaves = async () => {
        try {
          const [myReqs, approvals] = await Promise.all([
            LeaveV2Service.getMyRequests().catch(() => []),
            LeaveV2Service.getApprovals().catch(() => [])
          ]);

          const todayMs = new Date().setHours(0, 0, 0, 0);

          const allLocal = [...myReqs, ...approvals].filter((r: any) => {
            if (!r.fromDate || !r.toDate) return false;
            const fromMs = new Date(r.fromDate).setHours(0, 0, 0, 0);
            const toMs = new Date(r.toDate).setHours(0, 0, 0, 0);
            return todayMs >= fromMs && todayMs <= toMs;
          });

          const unique = Array.from(new Map(allLocal.map((r: any) => [r.id, r])).values());
          setLocalLeaves(unique);
        } catch (err) {
          console.error("Failed to fetch local leaves", err);
        }
      };
      fetchLocalLeaves();
    }
  }, [dashboardSettings?.cardTodayLeaves]);

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
  const stats: {
    eyebrow: string;
    value: React.ReactNode;
    trend?: string;
    icon: React.ReactNode;
    accent: string;
    subtle?: string;
    chart?: React.ReactNode;
  }[] = dashboardData
      ? (() => {
        const closedT = dashboardData.stats.tickets.closed;
        const totalT = dashboardData.stats.tickets.total;
        const openT = Math.max(0, totalT - closedT);
        const completionPctT = totalT > 0 ? Math.round((closedT / totalT) * 100) : 0;
        const presentA = dashboardData.stats.attendance.present;
        const totalA = dashboardData.stats.totalMembers;
        const rateA = dashboardData.stats.attendance.attendanceRate;
        const absentA = dashboardData.stats.attendance.absent;
        const lateA = dashboardData.stats.attendance.late;
        const allStats = [
          {
            eyebrow: "Total Members",
            value: dashboardData.stats.totalMembers,
            icon: <TeamOutlined />,
            accent: "#0EA5E9",
            subtle: `Growth ${dashboardData.trends.memberGrowth} this period`,
            chart: (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <RocketOutlined style={{ color: "#0EA5E9", fontSize: 13 }} />
                <Text style={{ fontSize: 11.5, color: token.colorTextSecondary }}>
                  {presentA} active today
                </Text>
              </div>
            ),
          },
          {
            eyebrow: "Active Projects",
            value: dashboardData.stats.activeProjects,
            icon: <ProjectOutlined />,
            accent: "#7C3AED",
            subtle: `Growth ${dashboardData.trends.projectGrowth} this period`,
            chart:
              dashboardData.stats.activeProjects > 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      flex: 1,
                      height: 6,
                      background: "rgba(124,58,237,0.12)",
                      borderRadius: 999,
                      overflow: "hidden",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        height: "100%",
                        width: `${Math.min(100, dashboardData.stats.activeProjects * 12)}%`,
                        background: "linear-gradient(90deg, #7C3AED, #A78BFA)",
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
                    {dashboardData.stats.activeProjects} live
                  </span>
                </div>
              ) : null,
          },
          {
            eyebrow: "Tickets",
            value: `${closedT} / ${totalT}`,
            icon: <TrophyOutlined />,
            accent: "#F59E0B",
            subtle:
              totalT > 0
                ? `${completionPctT}% completion · ${openT} open`
                : "No tickets yet",
            chart:
              totalT > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
                        width: `${(closedT / totalT) * 100}%`,
                        background: "#F59E0B",
                        display: "block",
                        height: "100%",
                        transition: "width .4s ease",
                      }}
                    />
                    <span
                      style={{
                        width: `${(openT / totalT) * 100}%`,
                        background: "#FCD34D",
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
                          background: "#F59E0B",
                        }}
                      />
                      {closedT} closed
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
                          background: "#FCD34D",
                        }}
                      />
                      {openT} open
                    </span>
                  </div>
                </div>
              ) : null,
          },
          {
            eyebrow: "Team Today",
            value: `${presentA} / ${totalA}`,
            icon: <ClockCircleOutlined />,
            accent: "#10B981",
            subtle: `${rateA}% present · ${absentA} absent · ${lateA} late`,
            chart: (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    flex: 1,
                    height: 6,
                    background: "rgba(16,185,129,0.12)",
                    borderRadius: 999,
                    overflow: "hidden",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      height: "100%",
                      width: `${rateA}%`,
                      background: "linear-gradient(90deg, #10B981, #34D399)",
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
                  {rateA}%
                </span>
              </div>
            ),
          }
        ];

        return allStats.filter((stat) => {
          if (stat.eyebrow === "Team Today" && !isMetricOrgTeamTodayVisible) return false;
          if (stat.eyebrow === "Tickets" && !isMetricOrgTicketsVisible) return false;
          if (stat.eyebrow === "Total Members" && !isMetricTotalMembersVisible) return false;
          if (stat.eyebrow === "Active Projects" && !isMetricActiveProjectsVisible) return false;
          return true;
        });
      })()
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


  // ─── Birthdays render ─────────────────────────────────────────────
  const renderTodayLeaves = () => {
    const todayLeaves = dashboardData?.todayLeaves;
    const allLeaves: any[] = [];

    if (todayLeaves) {
      if (todayLeaves.onLeave) allLeaves.push(...todayLeaves.onLeave.map((l: any) => ({ ...l, tag: "Leave", color: "#EC4899" })));
      if (todayLeaves.onPermission) allLeaves.push(...todayLeaves.onPermission.map((l: any) => ({ ...l, tag: "Permission", color: "#F59E0B" })));
      if (todayLeaves.workingFromHome) allLeaves.push(...todayLeaves.workingFromHome.map((l: any) => ({ ...l, tag: "WFH", color: "#10B981" })));
    }

    localLeaves.forEach((r: any) => {
      const name = r.userName || user?.name || "Unknown";
      const isExist = allLeaves.some(l => l.user?.name === name);
      if (!isExist) {
        allLeaves.push({
          user: {
            name: name,
            position: r.leaveTypeName || "Leave Request",
          },
          tag: r.status === 'pending' ? "Pending Leave" : "Leave",
          color: r.status === 'pending' ? "#F59E0B" : "#EC4899",
        });
      }
    });

    if (allLeaves.length === 0) {
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
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: `linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)`,
              border: "1px solid rgba(16, 185, 129, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#10B981",
              marginBottom: 16,
              boxShadow: "0 8px 16px rgba(16, 185, 129, 0.1)",
            }}
          >
            <CalendarOutlined style={{ fontSize: 24 }} />
          </div>
          <Text
            strong
            style={{
              fontSize: 14,
              color: token.colorText,
              display: "block",
              marginBottom: 4,
            }}
          >
            Full House Today!
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            No one is on leave. The whole team is here!
          </Text>
        </div>
      );
    }

    return (
      <div
        style={{
          flex: 1,
          padding: "16px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
        className="no-scrollbar"
      >
        {allLeaves.map((leave, idx) => {
          const isPending = leave.tag.includes("Pending");
          return (
            <div
              key={idx}
              className="premium-hover-card"
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 14px",
                borderRadius: 12,
                background: token.colorBgContainer,
                boxShadow: `0 2px 8px ${token.colorText}08, 0 1px 2px ${token.colorText}04`,
                border: `1px solid ${token.colorBorderSecondary}`,
                overflow: "hidden",
                transition: "all 0.3s ease",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = `0 6px 16px ${leave.color}15, 0 2px 4px ${leave.color}10`;
                e.currentTarget.style.borderColor = `${leave.color}40`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = `0 2px 8px ${token.colorText}08, 0 1px 2px ${token.colorText}04`;
                e.currentTarget.style.borderColor = token.colorBorderSecondary;
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 4,
                  background: leave.color,
                  opacity: 0.8,
                }}
              />

              <Avatar
                size={38}
                style={{
                  backgroundColor: `${leave.color}15`,
                  color: leave.color,
                  fontSize: 14,
                  fontWeight: 700,
                  border: `1px solid ${leave.color}40`,
                }}
              >
                {(leave.user?.name?.[0] || "?").toUpperCase()}
              </Avatar>

              <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                <Text
                  strong
                  style={{
                    fontSize: 13,
                    color: token.colorText,
                    display: "block",
                    lineHeight: 1.4,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    marginBottom: 2,
                  }}
                >
                  {leave.user?.name || "Unknown User"}
                </Text>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {isPending && (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: leave.color,
                        boxShadow: `0 0 4px ${leave.color}`
                      }}
                    />
                  )}
                  <Text
                    style={{
                      fontSize: 11,
                      color: token.colorTextTertiary,
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {leave.user?.position || "Employee"}
                  </Text>
                </div>
              </div>

              <div
                style={{
                  padding: "4px 10px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${leave.color}15 0%, ${leave.color}05 100%)`,
                  color: leave.color,
                  border: `1px solid ${leave.color}30`,
                  boxShadow: `0 2px 4px ${leave.color}10`,
                  whiteSpace: "nowrap",
                }}
              >
                {leave.tag}
              </div>
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
          {(() => {
            const metricsSpan = stats.length === 1 ? 24 : stats.length === 2 ? 12 : stats.length === 3 ? 8 : 6;
            return (
              <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                {stats.map((s, i) => (
                  <Col xs={24} sm={12} lg={metricsSpan} key={i}>
                    <KpiCard
                      eyebrow={s.eyebrow}
                      value={s.value}
                      trend={s.trend}
                      trendTone="positive"
                      icon={s.icon}
                      accent={s.accent}
                      subtle={s.subtle}
                      chart={s.chart}
                    />
                  </Col>
                ))}
              </Row>
            );
          })()}

          {/* ─── Main Grid ──────────────────────────────────── */}
          {(() => {
            const visibleKeys = [
              isCardProjectPulseVisible && "projectPulse",
              isUpcomingBirthdaysVisible && "birthdays",
              isCardTodayLeavesVisible && "todayLeaves",
              isCardRecentActivitiesVisible && "activities"
            ].filter(Boolean) as string[];

            const N = visibleKeys.length;
            const spanMap: Record<string, number> = {};

            if (N >= 6) {
              for (let i = 0; i < N; i++) spanMap[visibleKeys[i]] = 8;
            } else if (N === 5) {
              spanMap[visibleKeys[0]] = 8; spanMap[visibleKeys[1]] = 8; spanMap[visibleKeys[2]] = 8;
              spanMap[visibleKeys[3]] = 12; spanMap[visibleKeys[4]] = 12;
            } else if (N === 4) {
              spanMap[visibleKeys[0]] = 12; spanMap[visibleKeys[1]] = 12;
              spanMap[visibleKeys[2]] = 12; spanMap[visibleKeys[3]] = 12;
            } else if (N === 3) {
              spanMap[visibleKeys[0]] = 8; spanMap[visibleKeys[1]] = 8; spanMap[visibleKeys[2]] = 8;
            } else if (N === 2) {
              spanMap[visibleKeys[0]] = 12; spanMap[visibleKeys[1]] = 12;
            } else if (N === 1) {
              spanMap[visibleKeys[0]] = 24;
            }

            return (
              <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                {isCardProjectPulseVisible && (
                  <Col xs={24} md={spanMap["projectPulse"] === 8 ? 12 : spanMap["projectPulse"]} lg={spanMap["projectPulse"]} xl={spanMap["projectPulse"]}>
                    <Card
                      style={{ ...cardBase, height: "100%", minHeight: 300, display: "flex", flexDirection: "column" }}
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
                            <Select
                              value={selectedProjectId || undefined}
                              onChange={(val) => setSelectedProjectId(val)}
                              size="small"
                              style={{ width: 140 }}
                              options={dashboardData.projectProgress.map((p) => ({
                                value: p.id,
                                label: p.name,
                              }))}
                            />
                          )}
                          <Button
                            type="link"
                            size="small"
                            onClick={() => router.push("/projects/manage")}
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
                )}



                {isCardTodayLeavesVisible && (
                  <Col xs={24} md={spanMap["todayLeaves"] === 8 ? 12 : spanMap["todayLeaves"]} lg={spanMap["todayLeaves"]} xl={spanMap["todayLeaves"]}>
                    <Card
                      style={{ ...cardBase, height: "100%", minHeight: 300, display: "flex", flexDirection: "column" }}
                      styles={{
                        body: { padding: 0, flex: 1, display: "flex", flexDirection: "column", minHeight: 0 },
                        header: { borderBottom: `1px solid ${token.colorBorderSecondary}`, padding: "16px 20px" }
                      }}
                      title={
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          {sectionTitle(<CalendarOutlined />, "Today's Leaves", "#EC4899")}
                          <Button
                            type="link"
                            style={{ padding: 0, height: "auto", fontSize: 13, fontWeight: 600 }}
                            onClick={() => router.push("/leaves-v2/apply")}
                          >
                            View All
                          </Button>
                        </div>
                      }
                    >
                      {renderTodayLeaves()}
                    </Card>
                  </Col>
                )}

                {isUpcomingBirthdaysVisible && (
                  <Col xs={24} md={spanMap["birthdays"] === 8 ? 12 : spanMap["birthdays"]} lg={spanMap["birthdays"]} xl={spanMap["birthdays"]}>
                    {(() => {
                      const accent = "#F59E0B";
                      const today = dayjs();
                      const users = dashboardData?.upcomingBirthdays || [];

                      const upcoming = users
                        .map((u: any) => {
                          let nextBDay = dayjs(u.dateOfBirth).year(today.year());
                          if (nextBDay.isBefore(today, 'day')) {
                            nextBDay = nextBDay.add(1, 'year');
                          }
                          return { ...u, nextBDay };
                        })
                        .sort((a: any, b: any) => a.nextBDay.valueOf() - b.nextBDay.valueOf())
                        .slice(0, 5);

                      return (
                        <Card
                          style={{ ...cardBase, height: "100%", minHeight: 300, display: "flex", flexDirection: "column" }}
                          styles={{ body: { padding: "16px 20px", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" } }}
                        >
                          <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 16
                          }}>
                            {sectionTitle(<GiftOutlined />, "Upcoming Birthdays", accent)}
                            <div style={{
                              background: `${accent}15`,
                              color: accent,
                              padding: "2px 8px",
                              borderRadius: 12,
                              fontSize: 12,
                              fontWeight: 600
                            }}>
                              {upcoming.length}
                            </div>
                          </div>

                          <div style={{ flex: 1, overflowY: "auto", paddingRight: 4 }}>
                            {upcoming.length > 0 ? (
                              <Space direction="vertical" size={6} style={{ width: "100%" }}>
                                {upcoming.map((u: any) => {
                                  const isToday = dayjs().isSame(u.nextBDay, 'day');
                                  const daysUntil = Math.ceil(dayjs(u.nextBDay).diff(today, 'day', true));
                                  return (
                                    <div
                                      key={u.id}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        padding: "10px 12px 10px 14px",
                                        background: token.colorBgContainer,
                                        borderRadius: 12,
                                        border: `1px solid ${token.colorBorderSecondary}`,
                                        position: "relative",
                                        overflow: "hidden",
                                        gap: 12
                                      }}
                                    >
                                      <span
                                        aria-hidden
                                        style={{
                                          position: "absolute",
                                          left: 0,
                                          top: 0,
                                          bottom: 0,
                                          width: 3,
                                          background: isToday ? accent : token.colorBorderSecondary,
                                        }}
                                      />
                                      <div style={{ position: "relative" }}>
                                        <div
                                          style={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: 10,
                                            background: isToday ? `${accent}14` : token.colorFillAlter,
                                            border: isToday ? `1px solid ${accent}33` : `1px solid ${token.colorBorderSecondary}`,
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: isToday ? accent : token.colorTextSecondary,
                                            fontSize: 16,
                                            flexShrink: 0,
                                            overflow: "hidden"
                                          }}
                                        >
                                          {u.avatarUrl ? (
                                            <img src={u.avatarUrl} alt={u.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                          ) : (
                                            <span style={{ fontWeight: 600 }}>{u.name?.[0]}</span>
                                          )}
                                        </div>
                                        {isToday && (
                                          <div style={{
                                            position: "absolute",
                                            bottom: -4,
                                            right: -4,
                                            fontSize: 14,
                                            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
                                          }}>
                                            🎉
                                          </div>
                                        )}
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
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis"
                                          }}
                                        >
                                          {u.name}
                                        </Text>
                                        <Text
                                          type="secondary"
                                          style={{
                                            fontSize: 11,
                                            lineHeight: 1.3,
                                            display: "block",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis"
                                          }}
                                        >
                                          {u.position ? (typeof u.position === 'string' ? u.position : (u.position.title || u.position.name || "Team Member")) : "Team Member"} • {isToday ? "Today!" : dayjs(u.nextBDay).format("MMMM Do")}
                                        </Text>
                                      </div>
                                      <div style={{
                                        background: isToday ? accent : `${accent}15`,
                                        color: isToday ? "#fff" : accent,
                                        padding: "4px 10px",
                                        borderRadius: 12,
                                        fontSize: 11,
                                        fontWeight: 700,
                                        letterSpacing: "0.5px",
                                        flexShrink: 0
                                      }}>
                                        {isToday ? "TODAY" : `${daysUntil}d`}
                                      </div>
                                    </div>
                                  );
                                })}
                              </Space>
                            ) : (
                              <div style={{
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "center",
                                opacity: 0.8
                              }}>
                                <GiftOutlined style={{ fontSize: 32, color: token.colorTextTertiary, marginBottom: 12 }} />
                                <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>No upcoming birthdays</Text>
                              </div>
                            )}
                          </div>
                        </Card>
                      );
                    })()}
                  </Col>
                )}
                {isCardRecentActivitiesVisible && (
                  <Col xs={24} md={spanMap["activities"] === 8 ? 12 : spanMap["activities"]} lg={spanMap["activities"]} xl={spanMap["activities"]}>
                    <Card
                      style={{ ...cardBase, height: "100%", minHeight: 300, display: "flex", flexDirection: "column" }}
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
                    >
                      {renderActivities()}
                    </Card>
                  </Col>
                )}


              </Row>
            );
          })()}
        </>
      ) : null}
    </div>
  );
}

export default function Organization({ dashboardSettings }: { dashboardSettings?: any }) {
  return (
    <Suspense fallback={<ZukvoLoader message="Loading dashboard..." />}>
      <DashboardContent dashboardSettings={dashboardSettings} />
    </Suspense>
  );
}
