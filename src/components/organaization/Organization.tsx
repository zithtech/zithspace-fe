"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  dashboardService,
  DashboardData,
} from "@/services/dashboardService";
import ReleasePlanService, {
  ReleasePlan,
} from "@/services/releasePlanService";
import { useZohoCalendar } from "@/hooks/useZohoCalendar";
import { EmployeeService } from "@/services/employeeServices";
import LeaveV2Service from "@/services/leaveV2Service";
import {
  Row,
  Col,
  Typography,
  Avatar,
  Button,
  Alert,
  Skeleton,
  theme,
  Select,
  Segmented,
} from "antd";
import {
  TeamOutlined,
  ProjectOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  CalendarOutlined,
  GiftOutlined,
  FireOutlined,
  SyncOutlined,
  CheckCircleFilled,
  ThunderboltFilled,
  ThunderboltOutlined,
  SmileOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import ZukvoLoader from "../common/ZukvoLoader";

const { Text } = Typography;

function DashboardContent({ dashboardSettings }: { dashboardSettings?: any }) {
  const { token } = theme.useToken();
  const { user, hasAnySubscriptionFeature } = useAuth();
  const router = useRouter();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [sprints, setSprints] = useState<ReleasePlan[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [localLeaves, setLocalLeaves] = useState<any[]>([]);
  const [leaveTab, setLeaveTab] = useState<string>("all");

  // Zoho Calendar Integration
  const { error: calendarError, successMessage: calendarSuccess } =
    useZohoCalendar();

  // Subscription & Settings Checks
  const isMetricTotalMembersVisible =
    dashboardSettings?.metricTotalMembers !== false &&
    hasAnySubscriptionFeature("admin_members");
  const isMetricActiveProjectsVisible =
    dashboardSettings?.metricActiveProjects !== false &&
    hasAnySubscriptionFeature("work_projects");
  const isMetricOrgTicketsVisible =
    dashboardSettings?.metricOrgTickets !== false &&
    hasAnySubscriptionFeature("work_projects");
  const isMetricOrgTeamTodayVisible =
    dashboardSettings?.metricOrgTeamToday !== false &&
    hasAnySubscriptionFeature("hrms_attendance", "my_hub_my_hub_general_attendance");

  const isCardSprintDetailsVisible =
    dashboardSettings?.cardSprintDetails !== false &&
    hasAnySubscriptionFeature("work_projects");
  const isCardProjectPulseVisible =
    dashboardSettings?.cardProjectPulse !== false &&
    hasAnySubscriptionFeature("work_projects");
  const isUpcomingBirthdaysVisible =
    dashboardSettings?.upcomingBirthdays !== false;
  const isCardTodayLeavesVisible =
    dashboardSettings?.cardTodayLeaves !== false &&
    hasAnySubscriptionFeature("hrms_leaves", "my_hub_my_hub_general_leaves");
  const isCardRecentActivitiesVisible =
    dashboardSettings?.cardRecentActivities !== false;

  // Fetch Data Function
  const loadData = async (isRefresh = false) => {
    if (!user) return;
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const [data, bdayData, sprintRes] = await Promise.all([
        dashboardService.getDashboardSummary().catch((err) => {
          console.error("Failed to fetch dashboard summary:", err);
          throw err;
        }),
        EmployeeService.getUpcomingBirthdays().catch(() => []),
        ReleasePlanService.getReleasePlans({
          type: "sprint_plan",
          limit: 30,
          sortBy: "startDate",
          sortOrder: "desc",
        }).catch((err) => {
          console.warn("Failed to fetch sprint plans:", err);
          return { data: [] };
        }),
      ]);

      setDashboardData(data);
      setBirthdays(bdayData || []);

      const plans: ReleasePlan[] = (sprintRes?.data || []) as ReleasePlan[];
      setSprints(plans);
      if (plans.length > 0) {
        const active = plans.find((p) => p.status === "active") || plans[0];
        setSelectedSprintId((prev) => prev || active.id);
      }
    } catch (err: any) {
      console.error("Failed to load organization data:", err);
      setError(err?.message || "Failed to load organization dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Fetch Leaves
  useEffect(() => {
    if (dashboardSettings?.cardTodayLeaves !== false) {
      const fetchLocalLeaves = async () => {
        try {
          const [myReqs, approvals] = await Promise.all([
            LeaveV2Service.getMyRequests().catch(() => []),
            LeaveV2Service.getApprovals().catch(() => []),
          ]);

          const todayMs = new Date().setHours(0, 0, 0, 0);

          const allLocal = [...myReqs, ...approvals].filter((r: any) => {
            if (!r.fromDate || !r.toDate) return false;
            const fromMs = new Date(r.fromDate).setHours(0, 0, 0, 0);
            const toMs = new Date(r.toDate).setHours(0, 0, 0, 0);
            return todayMs >= fromMs && todayMs <= toMs;
          });

          const unique = Array.from(
            new Map(allLocal.map((r: any) => [r.id, r])).values()
          );
          setLocalLeaves(unique);
        } catch (err) {
          console.error("Failed to fetch local leaves", err);
        }
      };
      fetchLocalLeaves();
    }
  }, [dashboardSettings?.cardTodayLeaves]);

  // Set default selected project
  useEffect(() => {
    if (
      dashboardData?.projectProgress &&
      dashboardData.projectProgress.length > 0 &&
      !selectedProjectId
    ) {
      setSelectedProjectId(dashboardData.projectProgress[0].id);
    }
  }, [dashboardData, selectedProjectId]);

  const selectedProject = useMemo(() => {
    if (!dashboardData?.projectProgress) return null;
    return (
      dashboardData.projectProgress.find((p) => p.id === selectedProjectId) ||
      dashboardData.projectProgress[0] ||
      null
    );
  }, [dashboardData, selectedProjectId]);

  const selectedSprint = useMemo(() => {
    if (!sprints || sprints.length === 0) return null;
    return sprints.find((s) => s.id === selectedSprintId) || sprints[0] || null;
  }, [sprints, selectedSprintId]);

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return "just now";
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "yesterday";
    return `${diffDays}d ago`;
  };

  // Compile Unified Leaves List
  const unifiedLeaves = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      position: string;
      type: "leave" | "wfh" | "permission";
      tag: string;
      color: string;
      isPending?: boolean;
    }> = [];

    const todayLeaves = dashboardData?.todayLeaves;
    if (todayLeaves) {
      if (todayLeaves.onLeave) {
        todayLeaves.onLeave.forEach((l: any, idx: number) => {
          list.push({
            id: l.id || `leave-${idx}`,
            name: l.user?.name || "Team Member",
            position: l.user?.position || l.type || "On Leave",
            type: "leave",
            tag: l.type || "On Leave",
            color: "#EC4899",
          });
        });
      }
      if (todayLeaves.workingFromHome) {
        todayLeaves.workingFromHome.forEach((l: any, idx: number) => {
          list.push({
            id: l.id || `wfh-${idx}`,
            name: l.user?.name || "Team Member",
            position: l.user?.position || "Remote",
            type: "wfh",
            tag: "Remote (WFH)",
            color: "#10B981",
          });
        });
      }
      if (todayLeaves.onPermission) {
        todayLeaves.onPermission.forEach((l: any, idx: number) => {
          list.push({
            id: l.id || `perm-${idx}`,
            name: l.user?.name || "Team Member",
            position: l.user?.position || "Permission",
            type: "permission",
            tag: "Permission",
            color: "#F59E0B",
          });
        });
      }
    }

    localLeaves.forEach((r: any, idx: number) => {
      const name = r.userName || user?.name || "Team Member";
      const isExist = list.some((l) => l.name.toLowerCase() === name.toLowerCase());
      if (!isExist) {
        const isWfh =
          (r.leaveTypeName || "").toLowerCase().includes("wfh") ||
          (r.leaveTypeName || "").toLowerCase().includes("home");
        const isPerm =
          (r.leaveTypeName || "").toLowerCase().includes("permission");
        const type = isWfh ? "wfh" : isPerm ? "permission" : "leave";
        const color = isWfh ? "#10B981" : isPerm ? "#F59E0B" : "#EC4899";

        list.push({
          id: r.id || `loc-${idx}`,
          name,
          position: r.leaveTypeName || "Leave Request",
          type,
          tag: r.status === "pending" ? "Pending Leave" : r.leaveTypeName || "Leave",
          color,
          isPending: r.status === "pending",
        });
      }
    });

    return list;
  }, [dashboardData?.todayLeaves, localLeaves, user]);

  const filteredLeaves = useMemo(() => {
    if (leaveTab === "all") return unifiedLeaves;
    return unifiedLeaves.filter((l) => l.type === leaveTab);
  }, [unifiedLeaves, leaveTab]);

  // Compile Sorted Upcoming Birthdays
  const upcomingBirthdaysList = useMemo(() => {
    const raw =
      birthdays.length > 0
        ? birthdays
        : dashboardData?.upcomingBirthdays || [];
    const today = dayjs();

    return raw
      .map((u: any) => {
        let nextBDay = dayjs(u.dateOfBirth).year(today.year());
        if (nextBDay.isBefore(today, "day")) {
          nextBDay = nextBDay.add(1, "year");
        }
        const daysUntil = Math.ceil(nextBDay.diff(today, "day", true));
        return { ...u, nextBDay, daysUntil };
      })
      .sort((a: any, b: any) => a.nextBDay.valueOf() - b.nextBDay.valueOf())
      .slice(0, 6);
  }, [birthdays, dashboardData?.upcomingBirthdays]);

  // Metrics Data Setup
  const statsList = useMemo(() => {
    if (!dashboardData) return [];

    const closedT = dashboardData.stats.tickets.closed || 0;
    const totalT = dashboardData.stats.tickets.total || 0;
    const openT = Math.max(0, totalT - closedT);
    const completionPctT = totalT > 0 ? Math.round((closedT / totalT) * 100) : 0;

    const presentA = dashboardData.stats.attendance.present || 0;
    const totalA = dashboardData.stats.totalMembers || 0;
    const rateA = dashboardData.stats.attendance.attendanceRate || 0;
    const absentA = dashboardData.stats.attendance.absent || 0;
    const lateA = dashboardData.stats.attendance.late || 0;

    const all = [
      {
        key: "members",
        visible: isMetricTotalMembersVisible,
        eyebrow: "Total Members",
        value: totalA,
        subtext: `${presentA} active today`,
        badge: dashboardData.trends.memberGrowth || "+0%",
        badgeType: "positive" as const,
        icon: <TeamOutlined />,
        accent: "#3B82F6",
        onClick: () => router.push("/members"),
        progressNode: (
          <div className="org-mini-track-bg">
            <div
              className="org-mini-track-fill"
              style={{
                width: `${totalA > 0 ? Math.min(100, Math.round((presentA / totalA) * 100)) : 0}%`,
                background: "linear-gradient(90deg, #3B82F6, #60A5FA)",
              }}
            />
          </div>
        ),
      },
      {
        key: "projects",
        visible: isMetricActiveProjectsVisible,
        eyebrow: "Active Projects",
        value: dashboardData.stats.activeProjects || 0,
        subtext: `${dashboardData.projectProgress?.length || 0} tracking total`,
        badge: dashboardData.trends.projectGrowth || "+0%",
        badgeType: "positive" as const,
        icon: <ProjectOutlined />,
        accent: "#8B5CF6",
        onClick: () => router.push("/projects/manage"),
        progressNode: (
          <div className="org-mini-track-bg">
            <div
              className="org-mini-track-fill"
              style={{
                width: `${Math.min(100, (dashboardData.stats.activeProjects || 0) * 15)}%`,
                background: "linear-gradient(90deg, #8B5CF6, #A78BFA)",
              }}
            />
          </div>
        ),
      },
      {
        key: "tickets",
        visible: isMetricOrgTicketsVisible,
        eyebrow: "Ticket Health",
        value: `${closedT} / ${totalT}`,
        subtext: `${openT} pending · ${closedT} resolved`,
        badge: `${completionPctT}%`,
        badgeType: completionPctT >= 70 ? ("positive" as const) : ("neutral" as const),
        icon: <TrophyOutlined />,
        accent: "#F59E0B",
        onClick: () => router.push("/projects/tickets"),
        progressNode: (
          <div className="org-mini-track-split">
            <span
              style={{
                width: `${totalT > 0 ? (closedT / totalT) * 100 : 0}%`,
                background: "#10B981",
              }}
            />
            <span
              style={{
                width: `${totalT > 0 ? (openT / totalT) * 100 : 0}%`,
                background: "#F59E0B",
              }}
            />
          </div>
        ),
      },
      {
        key: "attendance",
        visible: isMetricOrgTeamTodayVisible,
        eyebrow: "Team Attendance",
        value: `${rateA}%`,
        subtext: `${presentA} present · ${absentA} absent · ${lateA} late`,
        badge: `${presentA}/${totalA}`,
        badgeType: rateA >= 80 ? ("positive" as const) : ("warning" as const),
        icon: <ClockCircleOutlined />,
        accent: "#10B981",
        onClick: () => router.push("/my-hub/attendance"),
        progressNode: (
          <div className="org-mini-track-bg">
            <div
              className="org-mini-track-fill"
              style={{
                width: `${Math.min(100, rateA)}%`,
                background: "linear-gradient(90deg, #10B981, #34D399)",
              }}
            />
          </div>
        ),
      },
    ];

    return all.filter((s) => s.visible !== false);
  }, [
    dashboardData,
    isMetricTotalMembersVisible,
    isMetricActiveProjectsVisible,
    isMetricOrgTicketsVisible,
    isMetricOrgTeamTodayVisible,
    router,
  ]);

  // Dynamic grid span calculation
  const hasLeftCol =
    isCardSprintDetailsVisible ||
    isUpcomingBirthdaysVisible ||
    isCardProjectPulseVisible;
  const hasRightCol =
    isCardTodayLeavesVisible || isCardRecentActivitiesVisible;

  const leftSpan = hasLeftCol && hasRightCol ? 13 : 24;
  const rightSpan = hasLeftCol && hasRightCol ? 11 : 24;

  // Selected Sprint Derived Stats
  const sprintStats = useMemo(() => {
    if (!selectedSprint) return null;

    const totalTickets =
      selectedSprint.totalTickets ?? (selectedSprint.tickets?.length || 0);
    const completedTickets =
      selectedSprint.completedTickets ??
      (selectedSprint.tickets?.filter((t) =>
        ["completed", "done", "closed", "resolved"].includes(
          (t.status || "").toLowerCase()
        )
      ).length || 0);
    const inProgressTickets =
      selectedSprint.inProgressTickets ??
      (selectedSprint.tickets?.filter((t) =>
        ["in_progress", "in_testing", "active", "started"].includes(
          (t.status || "").toLowerCase()
        )
      ).length || 0);
    const notStartedTickets =
      selectedSprint.notStartedTickets ??
      Math.max(0, totalTickets - completedTickets - inProgressTickets);
    const progressPct =
      totalTickets > 0
        ? Math.round((completedTickets / totalTickets) * 100)
        : selectedSprint.progress || 0;

    const today = dayjs();
    const end = selectedSprint.endDate ? dayjs(selectedSprint.endDate) : null;
    const start = selectedSprint.startDate ? dayjs(selectedSprint.startDate) : null;
    const daysLeft = end ? Math.ceil(end.diff(today, "day", true)) : null;
    const isOverdue =
      daysLeft !== null && daysLeft < 0 && selectedSprint.status !== "completed";
    const isEndingToday = daysLeft === 0;

    const projectName =
      typeof selectedSprint.project === "object"
        ? selectedSprint.project.name
        : selectedSprint.project || "General";

    return {
      totalTickets,
      completedTickets,
      inProgressTickets,
      notStartedTickets,
      progressPct,
      start,
      end,
      daysLeft,
      isOverdue,
      isEndingToday,
      projectName,
    };
  }, [selectedSprint]);

  return (
    <div className="org-dashboard-wrapper">
      <style>{`
        .org-dashboard-wrapper {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        /* Clean Card Surface */
        .org-card {
          background: ${token.colorBgContainer};
          border: 1px solid ${token.colorBorderSecondary};
          border-radius: 12px;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .org-card:hover {
          border-color: ${token.colorPrimary}40;
          box-shadow: 0 6px 16px -3px rgba(15, 23, 42, 0.08);
        }

        /* KPI Card */
        .org-kpi-card {
          background: ${token.colorBgContainer};
          border: 1px solid ${token.colorBorderSecondary};
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          height: 100%;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .org-kpi-card:hover {
          transform: translateY(-2px);
          border-color: ${token.colorPrimary}66;
          box-shadow: 0 6px 16px -3px rgba(15, 23, 42, 0.07);
        }

        /* Mini progress bar */
        .org-mini-track-bg {
          height: 5px;
          width: 100%;
          background: ${token.colorFillAlter};
          border-radius: 999px;
          overflow: hidden;
          margin-top: 2px;
        }
        .org-mini-track-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 0.4s ease;
        }
        .org-mini-track-split {
          height: 5px;
          width: 100%;
          background: ${token.colorFillAlter};
          border-radius: 999px;
          display: flex;
          overflow: hidden;
          gap: 1px;
          margin-top: 2px;
        }
        .org-mini-track-split > span {
          height: 100%;
          transition: width 0.4s ease;
        }

        /* Custom Slim Scrollbars */
        .org-slim-scroll {
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.28) transparent;
        }
        .org-slim-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .org-slim-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .org-slim-scroll::-webkit-scrollbar-thumb {
          background-color: rgba(148, 163, 184, 0.28);
          border-radius: 999px;
        }
        .org-slim-scroll::-webkit-scrollbar-thumb:hover {
          background-color: rgba(148, 163, 184, 0.55);
        }

        /* Hover row */
        .org-hover-row {
          transition: background-color 0.15s ease, transform 0.15s ease;
          border-radius: 8px;
        }
        .org-hover-row:hover {
          background-color: ${token.colorFillAlter};
        }

        /* Live indicator pulse */
        .org-pulse-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background-color: #10B981;
          display: inline-block;
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6);
          animation: orgPulse 2s infinite cubic-bezier(0.4, 0, 0.6, 1);
        }
        @keyframes orgPulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6); }
          70% { box-shadow: 0 0 0 7px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        /* Project Switcher Pill */
        .org-proj-chip {
          padding: 4px 10px;
          border-radius: 7px;
          cursor: pointer;
          transition: all 0.18s ease;
          border: 1px solid ${token.colorBorderSecondary};
          background: ${token.colorBgContainer};
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          white-space: nowrap;
        }
        .org-proj-chip:hover {
          background: ${token.colorFillAlter};
          border-color: ${token.colorPrimary}50;
        }
        .org-proj-chip.is-active {
          background: ${token.colorPrimaryBg || "#EFF6FF"};
          border-color: ${token.colorPrimary}70;
          color: ${token.colorPrimary};
          font-weight: 700;
        }
      `}</style>

      {/* ─── Alerts ────────────────────────────────────────────── */}
      {error && (
        <Alert
          message="Notice"
          description={error}
          type="error"
          showIcon
          closable
          style={{ borderRadius: 10 }}
        />
      )}
      {calendarError && (
        <Alert
          message="Calendar Notice"
          description={calendarError}
          type="warning"
          showIcon
          closable
          style={{ borderRadius: 10 }}
        />
      )}
      {calendarSuccess && (
        <Alert
          message="Synced"
          description={calendarSuccess}
          type="success"
          showIcon
          closable
          style={{ borderRadius: 10 }}
        />
      )}

      {/* ─── Executive Summary Ribbon ──────────────────────────── */}
      <div
        style={{
          background: token.colorBgContainer,
          border: `1px solid ${token.colorBorderSecondary}`,
          borderRadius: 10,
          padding: "9px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "3px 9px",
              borderRadius: 6,
              background: token.colorFillAlter,
              border: `1px solid ${token.colorBorderSecondary}`,
              fontSize: 11.5,
              fontWeight: 600,
              color: token.colorTextSecondary,
            }}
          >
            <span className="org-pulse-dot" />
            <span>Organization Live</span>
          </div>

          <Text style={{ fontSize: 12, color: token.colorTextTertiary }}>
            {dashboardData?.period?.month || dayjs().format("MMMM YYYY")}
          </Text>

          {/* Quick Signal: Top Performer */}
          {dashboardData?.teamPerformance?.topPerformer?.user && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11.5,
                color: token.colorTextSecondary,
                padding: "3px 9px",
                borderRadius: 6,
                background: "#F59E0B12",
                border: "1px solid #F59E0B28",
              }}
            >
              <TrophyOutlined style={{ color: "#F59E0B", fontSize: 11.5 }} />
              <span style={{ fontWeight: 600, color: token.colorText }}>
                {dashboardData.teamPerformance.topPerformer.user.name}
              </span>
              <span style={{ color: token.colorTextTertiary }}>
                · {dashboardData.teamPerformance.topPerformer.completedTickets} closed
              </span>
            </div>
          )}

          {/* Quick Signal: Daily Updates */}
          {dashboardData?.teamPerformance?.dailyUpdates && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11.5,
                color: token.colorTextSecondary,
                padding: "3px 9px",
                borderRadius: 6,
                background: token.colorFillAlter,
                border: `1px solid ${token.colorBorderSecondary}`,
              }}
            >
              <ThunderboltFilled style={{ color: token.colorPrimary, fontSize: 11 }} />
              <span>
                Daily Updates:{" "}
                <strong style={{ color: token.colorText }}>
                  {dashboardData.teamPerformance.dailyUpdates.submitted} /{" "}
                  {dashboardData.teamPerformance.dailyUpdates.total}
                </strong>
              </span>
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Button
            type="text"
            size="small"
            icon={<SyncOutlined spin={refreshing} />}
            onClick={() => loadData(true)}
            style={{
              fontSize: 12,
              color: token.colorTextSecondary,
              height: 28,
              borderRadius: 6,
              padding: "0 10px",
            }}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* ─── Metric Ribbon (KPI Cards) ─────────────────────────── */}
      {loading ? (
        <Row gutter={[12, 12]}>
          {[1, 2, 3, 4].map((i) => (
            <Col xs={24} sm={12} lg={6} key={i}>
              <div
                style={{
                  background: token.colorBgContainer,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <Skeleton active paragraph={{ rows: 1 }} />
              </div>
            </Col>
          ))}
        </Row>
      ) : (
        statsList.length > 0 && (
          <Row gutter={[12, 12]}>
            {statsList.map((stat) => {
              const spanVal =
                statsList.length === 1
                  ? 24
                  : statsList.length === 2
                    ? 12
                    : statsList.length === 3
                      ? 8
                      : 6;

              return (
                <Col xs={24} sm={12} lg={spanVal} key={stat.key}>
                  <div className="org-kpi-card" onClick={stat.onClick}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 6,
                            background: `${stat.accent}14`,
                            border: `1px solid ${stat.accent}2E`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: stat.accent,
                            fontSize: 11.5,
                            flexShrink: 0,
                          }}
                        >
                          {stat.icon}
                        </div>
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            color: token.colorTextSecondary,
                          }}
                        >
                          {stat.eyebrow}
                        </span>
                      </div>

                      {stat.badge && (
                        <span
                          style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: 999,
                            background:
                              stat.badgeType === "positive"
                                ? `${token.colorSuccess}15`
                                : stat.badgeType === "warning"
                                  ? `${token.colorWarning}15`
                                  : token.colorFillAlter,
                            color:
                              stat.badgeType === "positive"
                                ? token.colorSuccess
                                : stat.badgeType === "warning"
                                  ? token.colorWarning
                                  : token.colorTextSecondary,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 2,
                          }}
                        >
                          {stat.badge}
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                        marginTop: 2,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 21,
                          fontWeight: 800,
                          color: token.colorText,
                          fontVariantNumeric: "tabular-nums",
                          lineHeight: 1.15,
                        }}
                      >
                        {stat.value}
                      </span>
                      <span
                        style={{
                          fontSize: 11.5,
                          color: token.colorTextTertiary,
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {stat.subtext}
                      </span>
                    </div>

                    {stat.progressNode}
                  </div>
                </Col>
              );
            })}
          </Row>
        )
      )}

      {/* ─── Main Content Grid ─────────────────────────────────── */}
      {loading ? (
        <Row gutter={[14, 14]}>
          <Col xs={24} lg={14}>
            <div
              style={{
                background: token.colorBgContainer,
                border: `1px solid ${token.colorBorderSecondary}`,
                borderRadius: 12,
                padding: 16,
                minHeight: 320,
              }}
            >
              <Skeleton active paragraph={{ rows: 7 }} />
            </div>
          </Col>
          <Col xs={24} lg={10}>
            <div
              style={{
                background: token.colorBgContainer,
                border: `1px solid ${token.colorBorderSecondary}`,
                borderRadius: 12,
                padding: 16,
                minHeight: 320,
              }}
            >
              <Skeleton active paragraph={{ rows: 7 }} />
            </div>
          </Col>
        </Row>
      ) : dashboardData ? (
        <Row gutter={[14, 14]} align="stretch">
          {/* ─── LEFT COLUMN: Sprint Details, Celebrations, and Compact Project Pulse ─── */}
          {hasLeftCol && (
            <Col xs={24} lg={leftSpan}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
                {/* 1. SPRINT DETAILS (PRODUCTION-READY TOP SECTION) */}
                {isCardSprintDetailsVisible && (
                  <div className="org-card" style={{ flex: "0 0 auto" }}>
                    {/* Header */}
                    <div
                      style={{
                        padding: "9px 16px",
                        borderBottom: `1px solid ${token.colorBorderSecondary}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 8,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 6,
                            background: "#8B5CF618",
                            border: "1px solid #8B5CF630",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#8B5CF6",
                            fontSize: 12,
                          }}
                        >
                          <ThunderboltOutlined />
                        </div>
                        <Text strong style={{ fontSize: 13, color: token.colorText }}>
                          Sprint Details & Velocity
                        </Text>

                        {selectedSprint && (
                          <span
                            style={{
                              fontSize: 9.5,
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: 4,
                              background:
                                selectedSprint.status === "active"
                                  ? "#10B98118"
                                  : selectedSprint.status === "planning"
                                    ? "#F59E0B18"
                                    : token.colorFillAlter,
                              color:
                                selectedSprint.status === "active"
                                  ? "#10B981"
                                  : selectedSprint.status === "planning"
                                    ? "#F59E0B"
                                    : token.colorTextSecondary,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            {selectedSprint.status === "active" && (
                              <span className="org-pulse-dot" style={{ width: 5, height: 5 }} />
                            )}
                            {(selectedSprint.status || "active").toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {sprints.length > 1 && (
                          <Select
                            value={selectedSprintId || undefined}
                            onChange={(val) => setSelectedSprintId(val)}
                            size="small"
                            style={{ width: 160 }}
                            options={sprints.map((s) => ({
                              value: s.id,
                              label: `${s.version || s.name || "Sprint"} (${s.status || "active"})`,
                            }))}
                            dropdownMatchSelectWidth={false}
                          />
                        )}
                        <Button
                          type="link"
                          size="small"
                          onClick={() => router.push("/projects/tickets")}
                          style={{ fontSize: 11.5, padding: "0 4px", height: "auto" }}
                        >
                          Sprint Board →
                        </Button>
                      </div>
                    </div>

                    {/* Body */}
                    <div style={{ padding: "10px 14px" }}>
                      {!selectedSprint || !sprintStats ? (
                        <div
                          style={{
                            padding: "16px 10px",
                            textAlign: "center",
                            color: token.colorTextTertiary,
                            fontSize: 11.5,
                          }}
                        >
                          <ThunderboltOutlined style={{ fontSize: 20, color: token.colorTextTertiary, marginBottom: 4 }} />
                          <div>No active sprint plans scheduled.</div>
                          <Button
                            type="link"
                            size="small"
                            onClick={() => router.push("/projects/manage")}
                            style={{ fontSize: 11.5, marginTop: 2 }}
                          >
                            Plan a Sprint in Projects →
                          </Button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                          {/* Sprint Title, Project Tag, and Dates */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 8,
                            }}
                          >
                            <div style={{ minWidth: 0, display: "flex", alignItems: "center", gap: 7 }}>
                              <Text
                                strong
                                style={{
                                  fontSize: 13,
                                  color: token.colorText,
                                  lineHeight: 1.25,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {selectedSprint.version || selectedSprint.name || "Sprint Plan"}
                              </Text>
                              <span
                                style={{
                                  padding: "1px 6px",
                                  borderRadius: 4,
                                  fontSize: 10,
                                  fontWeight: 600,
                                  background: "#3B82F614",
                                  color: "#3B82F6",
                                  border: "1px solid #3B82F624",
                                  flexShrink: 0,
                                }}
                              >
                                {sprintStats.projectName}
                              </span>
                            </div>

                            {/* Date & Deadline Chip */}
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <span
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: 600,
                                  padding: "2px 7px",
                                  borderRadius: 4,
                                  background: sprintStats.isOverdue
                                    ? "#EF444415"
                                    : sprintStats.isEndingToday
                                      ? "#F59E0B15"
                                      : token.colorFillAlter,
                                  color: sprintStats.isOverdue
                                    ? "#EF4444"
                                    : sprintStats.isEndingToday
                                      ? "#F59E0B"
                                      : token.colorTextSecondary,
                                  border: `1px solid ${
                                    sprintStats.isOverdue
                                      ? "#EF444430"
                                      : token.colorBorderSecondary
                                  }`,
                                  display: "inline-block",
                                }}
                              >
                                {sprintStats.start && sprintStats.end
                                  ? `${sprintStats.start.format("MMM D")} – ${sprintStats.end.format("MMM D")}`
                                  : "Dates Unset"}
                                {sprintStats.daysLeft !== null && (
                                  <>
                                    {" "}
                                    ·{" "}
                                    <strong>
                                      {sprintStats.isOverdue
                                        ? `Overdue by ${Math.abs(sprintStats.daysLeft)}d`
                                        : sprintStats.isEndingToday
                                          ? "Ends Today"
                                          : `${sprintStats.daysLeft}d left`}
                                    </strong>
                                  </>
                                )}
                              </span>
                            </div>
                          </div>

                          {selectedSprint.goal && (
                            <Text
                              style={{
                                fontSize: 11,
                                color: token.colorTextSecondary,
                                fontStyle: "italic",
                                marginTop: -2,
                                display: "block",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              🎯 {selectedSprint.goal}
                            </Text>
                          )}

                          {/* Velocity Progress Bar & Metric Counters */}
                          <div
                            style={{
                              background: token.colorFillAlter,
                              border: `1px solid ${token.colorBorderSecondary}`,
                              borderRadius: 8,
                              padding: "8px 12px",
                              display: "flex",
                              flexDirection: "column",
                              gap: 6,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontSize: 11.5, fontWeight: 700, color: token.colorText }}>
                                  Sprint Velocity
                                </span>
                                <span
                                  style={{
                                    fontSize: 10.5,
                                    fontWeight: 700,
                                    color: "#10B981",
                                    background: "#10B98114",
                                    padding: "1px 5px",
                                    borderRadius: 4,
                                  }}
                                >
                                  {sprintStats.progressPct}%
                                </span>
                              </div>

                              <span style={{ fontSize: 10.5, color: token.colorTextTertiary }}>
                                {sprintStats.completedTickets} of {sprintStats.totalTickets} tickets done
                              </span>
                            </div>

                            {/* Multi-track segmented progress */}
                            <div
                              style={{
                                height: 5,
                                width: "100%",
                                background: "rgba(148, 163, 184, 0.20)",
                                borderRadius: 999,
                                display: "flex",
                                overflow: "hidden",
                                gap: 1,
                              }}
                            >
                              <span
                                style={{
                                  width: `${
                                    sprintStats.totalTickets > 0
                                      ? (sprintStats.completedTickets / sprintStats.totalTickets) * 100
                                      : 0
                                  }%`,
                                  background: "#10B981",
                                  transition: "width 0.4s ease",
                                }}
                              />
                              <span
                                style={{
                                  width: `${
                                    sprintStats.totalTickets > 0
                                      ? (sprintStats.inProgressTickets / sprintStats.totalTickets) * 100
                                      : 0
                                  }%`,
                                  background: "#3B82F6",
                                  transition: "width 0.4s ease",
                                }}
                              />
                              <span
                                style={{
                                  width: `${
                                    sprintStats.totalTickets > 0
                                      ? (sprintStats.notStartedTickets / sprintStats.totalTickets) * 100
                                      : 0
                                  }%`,
                                  background: "#F59E0B",
                                  transition: "width 0.4s ease",
                                }}
                              />
                            </div>

                            {/* 4 Ticket Status Badges */}
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(4, 1fr)",
                                gap: 5,
                                marginTop: 1,
                              }}
                            >
                              <div
                                style={{
                                  background: token.colorBgContainer,
                                  border: `1px solid ${token.colorBorderSecondary}`,
                                  borderRadius: 6,
                                  padding: "3px 6px",
                                  textAlign: "center",
                                }}
                              >
                                <div style={{ fontSize: 9, color: token.colorTextTertiary, textTransform: "uppercase", fontWeight: 700 }}>
                                  Total
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: token.colorText, fontVariantNumeric: "tabular-nums" }}>
                                  {sprintStats.totalTickets}
                                </div>
                              </div>

                              <div
                                style={{
                                  background: "#10B9810C",
                                  border: "1px solid #10B98126",
                                  borderRadius: 6,
                                  padding: "3px 6px",
                                  textAlign: "center",
                                }}
                              >
                                <div style={{ fontSize: 9, color: "#10B981", textTransform: "uppercase", fontWeight: 700 }}>
                                  Done
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: "#10B981", fontVariantNumeric: "tabular-nums" }}>
                                  {sprintStats.completedTickets}
                                </div>
                              </div>

                              <div
                                style={{
                                  background: "#3B82F60C",
                                  border: "1px solid #3B82F626",
                                  borderRadius: 6,
                                  padding: "3px 6px",
                                  textAlign: "center",
                                }}
                              >
                                <div style={{ fontSize: 9, color: "#3B82F6", textTransform: "uppercase", fontWeight: 700 }}>
                                  Active
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: "#3B82F6", fontVariantNumeric: "tabular-nums" }}>
                                  {sprintStats.inProgressTickets}
                                </div>
                              </div>

                              <div
                                style={{
                                  background: "#F59E0B0C",
                                  border: "1px solid #F59E0B26",
                                  borderRadius: 6,
                                  padding: "3px 6px",
                                  textAlign: "center",
                                }}
                              >
                                <div style={{ fontSize: 9, color: "#F59E0B", textTransform: "uppercase", fontWeight: 700 }}>
                                  Todo
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: "#F59E0B", fontVariantNumeric: "tabular-nums" }}>
                                  {sprintStats.notStartedTickets}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Quick Ticket Preview (Top 2 Tickets) */}
                          {selectedSprint.tickets && selectedSprint.tickets.length > 0 && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 1 }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: token.colorTextTertiary,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.3px",
                                }}
                              >
                                <span>Sprint Tickets Preview</span>
                                <span
                                  onClick={() => router.push("/projects/tickets")}
                                  style={{
                                    cursor: "pointer",
                                    color: token.colorPrimary,
                                    textTransform: "none",
                                    fontWeight: 600,
                                    fontSize: 11,
                                  }}
                                >
                                  View all ({selectedSprint.tickets.length}) →
                                </span>
                              </div>

                              {selectedSprint.tickets.slice(0, 2).map((t, idx) => (
                                <div
                                  key={t.id || idx}
                                  className="org-hover-row"
                                  onClick={() => router.push("/projects/tickets")}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "4px 8px",
                                    borderRadius: 5,
                                    border: `1px solid ${token.colorBorderSecondary}`,
                                    background: token.colorBgContainer,
                                    cursor: "pointer",
                                    gap: 6,
                                  }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                                    <span
                                      style={{
                                        fontSize: 10,
                                        fontWeight: 700,
                                        fontFamily: "monospace",
                                        color: token.colorPrimary,
                                        background: `${token.colorPrimary}10`,
                                        padding: "1px 4px",
                                        borderRadius: 3,
                                        flexShrink: 0,
                                      }}
                                    >
                                      {t.ticketNumber || `T-${idx + 1}`}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: 11.5,
                                        color: token.colorText,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                      }}
                                    >
                                      {t.title}
                                    </span>
                                  </div>

                                  <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                                    {t.priority && (
                                      <span
                                        style={{
                                          fontSize: 9,
                                          fontWeight: 600,
                                          color:
                                            (t.priority || "").toLowerCase().includes("high") ||
                                            (t.priority || "").toLowerCase().includes("crit")
                                              ? "#EF4444"
                                              : token.colorTextTertiary,
                                        }}
                                      >
                                        {t.priority}
                                      </span>
                                    )}
                                    <span
                                      style={{
                                        padding: "1px 5px",
                                        borderRadius: 3,
                                        fontSize: 9.5,
                                        fontWeight: 600,
                                        background: ["completed", "done"].includes((t.status || "").toLowerCase())
                                          ? "#10B98114"
                                          : token.colorFillAlter,
                                        color: ["completed", "done"].includes((t.status || "").toLowerCase())
                                          ? "#10B981"
                                          : token.colorTextSecondary,
                                      }}
                                    >
                                      {t.status}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. UPCOMING CELEBRATIONS CARD */}
                {isUpcomingBirthdaysVisible && (
                  <div className="org-card" style={{ flex: "0 0 auto" }}>
                    {/* Header */}
                    <div
                      style={{
                        padding: "11px 16px",
                        borderBottom: `1px solid ${token.colorBorderSecondary}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 6,
                            background: "#F59E0B18",
                            border: "1px solid #F59E0B30",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#F59E0B",
                            fontSize: 12.5,
                          }}
                        >
                          <GiftOutlined />
                        </div>
                        <Text strong style={{ fontSize: 13.5, color: token.colorText }}>
                          Upcoming Celebrations
                        </Text>
                      </div>

                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: 999,
                          background: "#F59E0B14",
                          color: "#F59E0B",
                        }}
                      >
                        {upcomingBirthdaysList.length}
                      </span>
                    </div>

                    {/* Content List */}
                    <div style={{ padding: "8px 14px" }}>
                      {upcomingBirthdaysList.length === 0 ? (
                        <div
                          style={{
                            padding: "20px 10px",
                            textAlign: "center",
                            color: token.colorTextTertiary,
                            fontSize: 12,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                          }}
                        >
                          <SmileOutlined style={{ fontSize: 18, color: "#F59E0B" }} />
                          <span>No celebrations in the next 30 days.</span>
                        </div>
                      ) : (
                        <div
                          className="org-slim-scroll"
                          style={{
                            maxHeight: 200,
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                            gap: 6,
                          }}
                        >
                          {upcomingBirthdaysList.map((u: any) => {
                            const isToday = u.daysUntil === 0;
                            return (
                              <div
                                key={u.id || u.name}
                                className="org-hover-row"
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  padding: "7px 10px",
                                  borderRadius: 7,
                                  background: isToday
                                    ? "#F59E0B0A"
                                    : token.colorBgContainer,
                                  border: `1px solid ${
                                    isToday ? "#F59E0B3A" : token.colorBorderSecondary
                                  }`,
                                  gap: 8,
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    minWidth: 0,
                                  }}
                                >
                                  {u.avatarUrl ? (
                                    <Avatar src={u.avatarUrl} size={28} style={{ flexShrink: 0 }} />
                                  ) : (
                                    <Avatar
                                      size={28}
                                      style={{
                                        backgroundColor: isToday ? "#F59E0B" : token.colorPrimary,
                                        fontSize: 11,
                                        fontWeight: 700,
                                        flexShrink: 0,
                                      }}
                                    >
                                      {(u.name?.[0] || "?").toUpperCase()}
                                    </Avatar>
                                  )}

                                  <div style={{ minWidth: 0 }}>
                                    <div
                                      style={{
                                        fontSize: 12.5,
                                        fontWeight: 600,
                                        color: token.colorText,
                                        lineHeight: 1.25,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                      }}
                                    >
                                      {u.name}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: 10.5,
                                        color: token.colorTextTertiary,
                                        lineHeight: 1.2,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                      }}
                                    >
                                      {typeof u.position === "string"
                                        ? u.position
                                        : u.position?.title || u.position?.name || "Team Member"}
                                    </div>
                                  </div>
                                </div>

                                <div style={{ flexShrink: 0 }}>
                                  {isToday ? (
                                    <span
                                      style={{
                                        padding: "2px 7px",
                                        borderRadius: 5,
                                        fontSize: 10,
                                        fontWeight: 800,
                                        background: "#F59E0B",
                                        color: "#FFFFFF",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 3,
                                      }}
                                    >
                                      TODAY 🎂
                                    </span>
                                  ) : (
                                    <span
                                      style={{
                                        padding: "2px 7px",
                                        borderRadius: 5,
                                        fontSize: 10.5,
                                        fontWeight: 600,
                                        background: token.colorFillAlter,
                                        color: token.colorTextSecondary,
                                        border: `1px solid ${token.colorBorderSecondary}`,
                                      }}
                                    >
                                      {u.daysUntil <= 7
                                        ? `In ${u.daysUntil}d`
                                        : dayjs(u.nextBDay).format("MMM D")}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. PROJECT PULSE & HEALTH (REDESIGNED: MORE COMPACT & MOVED DOWN) */}
                {isCardProjectPulseVisible && (
                  <div className="org-card" style={{ flex: "0 0 auto" }}>
                    {/* Compact Header */}
                    <div
                      style={{
                        padding: "9px 16px",
                        borderBottom: `1px solid ${token.colorBorderSecondary}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 8,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 6,
                            background: "#0EA5E918",
                            border: "1px solid #0EA5E930",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#0EA5E9",
                            fontSize: 11.5,
                          }}
                        >
                          <ProjectOutlined />
                        </div>
                        <Text strong style={{ fontSize: 13, color: token.colorText }}>
                          Project Pulse & Health
                        </Text>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {dashboardData.projectProgress &&
                          dashboardData.projectProgress.length > 1 && (
                            <Select
                              value={selectedProjectId || undefined}
                              onChange={(val) => setSelectedProjectId(val)}
                              size="small"
                              style={{ width: 155 }}
                              options={dashboardData.projectProgress.map((p) => ({
                                value: p.id,
                                label: p.name,
                              }))}
                              dropdownMatchSelectWidth={false}
                            />
                          )}
                        <Button
                          type="link"
                          size="small"
                          onClick={() => router.push("/projects/manage")}
                          style={{ fontSize: 11.5, padding: "0 4px", height: "auto" }}
                        >
                          Manage →
                        </Button>
                      </div>
                    </div>

                    {/* Compact Body */}
                    <div style={{ padding: "10px 16px" }}>
                      {!selectedProject ? (
                        <div
                          style={{
                            padding: "14px 6px",
                            textAlign: "center",
                            color: token.colorTextTertiary,
                            fontSize: 11.5,
                          }}
                        >
                          No active projects found.
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                          {/* Row 1: Active Project Bar & Stats */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              flexWrap: "wrap",
                              gap: 10,
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 170 }}>
                              <Text
                                strong
                                style={{
                                  fontSize: 13,
                                  color: token.colorText,
                                  maxWidth: 160,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {selectedProject.name}
                              </Text>

                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 800,
                                  color:
                                    (selectedProject.progress || 0) >= 80
                                      ? "#10B981"
                                      : token.colorPrimary,
                                  fontVariantNumeric: "tabular-nums",
                                }}
                              >
                                {selectedProject.progress || 0}% Complete
                              </span>
                            </div>

                            {/* 3 Status Inline Chips */}
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span
                                style={{
                                  padding: "3px 8px",
                                  borderRadius: 5,
                                  fontSize: 10.5,
                                  fontWeight: 600,
                                  background: "#10B98112",
                                  color: "#10B981",
                                  border: "1px solid #10B98124",
                                }}
                              >
                                ● {selectedProject.completedTickets || 0} Done
                              </span>

                              <span
                                style={{
                                  padding: "3px 8px",
                                  borderRadius: 5,
                                  fontSize: 10.5,
                                  fontWeight: 600,
                                  background: "#3B82F612",
                                  color: "#3B82F6",
                                  border: "1px solid #3B82F624",
                                }}
                              >
                                ● {selectedProject.inProgressTickets || 0} Active
                              </span>

                              <span
                                style={{
                                  padding: "3px 8px",
                                  borderRadius: 5,
                                  fontSize: 10.5,
                                  fontWeight: 600,
                                  background: "#F59E0B12",
                                  color: "#F59E0B",
                                  border: "1px solid #F59E0B24",
                                }}
                              >
                                ● {selectedProject.notStartedTickets || 0} Todo
                              </span>
                            </div>
                          </div>

                          {/* Progress Line */}
                          <div
                            style={{
                              height: 5,
                              width: "100%",
                              background: token.colorFillAlter,
                              borderRadius: 999,
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${selectedProject.progress || 0}%`,
                                height: "100%",
                                background: "linear-gradient(90deg, #0EA5E9, #10B981)",
                                borderRadius: 999,
                                transition: "width 0.4s ease",
                              }}
                            />
                          </div>

                          {/* Multi-Project Mini Switcher Chips */}
                          {dashboardData.projectProgress &&
                            dashboardData.projectProgress.length > 1 && (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  overflowX: "auto",
                                  paddingTop: 3,
                                }}
                                className="org-slim-scroll"
                              >
                                <span
                                  style={{
                                    fontSize: 9.5,
                                    fontWeight: 700,
                                    color: token.colorTextTertiary,
                                    textTransform: "uppercase",
                                    flexShrink: 0,
                                  }}
                                >
                                  Switch:
                                </span>
                                {dashboardData.projectProgress.map((p) => {
                                  const isSel = p.id === selectedProjectId;
                                  return (
                                    <div
                                      key={p.id}
                                      className={`org-proj-chip ${isSel ? "is-active" : ""}`}
                                      onClick={() => setSelectedProjectId(p.id)}
                                    >
                                      <span>{p.name}</span>
                                      <span
                                        style={{
                                          fontSize: 9.5,
                                          fontWeight: 700,
                                          opacity: 0.8,
                                        }}
                                      >
                                        {p.progress || 0}%
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Col>
          )}

          {/* ─── RIGHT COLUMN: Team Presence & Real-time Stream ──── */}
          {hasRightCol && (
            <Col xs={24} lg={rightSpan}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
                {/* 4. TEAM PRESENCE & LEAVES CARD */}
                {isCardTodayLeavesVisible && (
                  <div className="org-card" style={{ flex: "1 1 auto", display: "flex", flexDirection: "column" }}>
                    {/* Header with Title, Action Link & Segmented Filter */}
                    <div
                      style={{
                        padding: "11px 16px",
                        borderBottom: `1px solid ${token.colorBorderSecondary}`,
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 6,
                              background: "#EC489918",
                              border: "1px solid #EC489930",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#EC4899",
                              fontSize: 12.5,
                            }}
                          >
                            <CalendarOutlined />
                          </div>
                          <Text strong style={{ fontSize: 13.5, color: token.colorText }}>
                            {"Today's Presence & Out of Office"}
                          </Text>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "2px 7px",
                              borderRadius: 999,
                              background: "#EC489914",
                              color: "#EC4899",
                            }}
                          >
                            {unifiedLeaves.length}
                          </span>
                        </div>

                        <Button
                          type="link"
                          size="small"
                          onClick={() => router.push("/leaves-v2/apply")}
                          style={{ fontSize: 12, padding: "0 4px", height: "auto" }}
                        >
                          View Leaves →
                        </Button>
                      </div>

                      {/* Segmented Filter */}
                      <Segmented
                        size="small"
                        block
                        value={leaveTab}
                        onChange={(val) => setLeaveTab(val as string)}
                        options={[
                          { label: `All (${unifiedLeaves.length})`, value: "all" },
                          {
                            label: `Leave (${unifiedLeaves.filter((l) => l.type === "leave").length})`,
                            value: "leave",
                          },
                          {
                            label: `WFH (${unifiedLeaves.filter((l) => l.type === "wfh").length})`,
                            value: "wfh",
                          },
                          {
                            label: `Permission (${unifiedLeaves.filter((l) => l.type === "permission").length})`,
                            value: "permission",
                          },
                        ]}
                      />
                    </div>

                    {/* Content List */}
                    <div style={{ padding: "8px 14px", flex: "1 1 auto", display: "flex", flexDirection: "column" }}>
                      {filteredLeaves.length === 0 ? (
                        <div
                          style={{
                            padding: "32px 10px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexDirection: "column",
                            gap: 8,
                            textAlign: "center",
                            flex: "1 1 auto",
                            minHeight: 180,
                          }}
                        >
                          <CheckCircleFilled style={{ color: "#10B981", fontSize: 22 }} />
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: token.colorTextSecondary }}>
                            {leaveTab === "all"
                              ? "Full House Today! All team members are active on-duty."
                              : `No team members on ${leaveTab} today.`}
                          </span>
                        </div>
                      ) : (
                        <div
                          className="org-slim-scroll"
                          style={{
                            maxHeight: 340,
                            flex: "1 1 auto",
                            display: "flex",
                            flexDirection: "column",
                            gap: 5,
                          }}
                        >
                          {filteredLeaves.map((leave) => (
                            <div
                              key={leave.id}
                              className="org-hover-row"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "6px 10px",
                                border: `1px solid ${token.colorBorderSecondary}`,
                                borderRadius: 7,
                                background: token.colorBgContainer,
                                gap: 8,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  minWidth: 0,
                                }}
                              >
                                <Avatar
                                  size={26}
                                  style={{
                                    backgroundColor: `${leave.color}18`,
                                    color: leave.color,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    border: `1px solid ${leave.color}33`,
                                    flexShrink: 0,
                                  }}
                                >
                                  {(leave.name[0] || "?").toUpperCase()}
                                </Avatar>

                                <div style={{ minWidth: 0 }}>
                                  <div
                                    style={{
                                      fontSize: 12.5,
                                      fontWeight: 600,
                                      color: token.colorText,
                                      lineHeight: 1.25,
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                  >
                                    {leave.name}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 10.5,
                                      color: token.colorTextTertiary,
                                      lineHeight: 1.2,
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                  >
                                    {leave.position}
                                  </div>
                                </div>
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                                {leave.isPending && (
                                  <span
                                    style={{
                                      width: 6,
                                      height: 6,
                                      borderRadius: "50%",
                                      background: leave.color,
                                    }}
                                  />
                                )}
                                <span
                                  style={{
                                    padding: "2px 7px",
                                    borderRadius: 5,
                                    fontSize: 10.5,
                                    fontWeight: 600,
                                    background: `${leave.color}15`,
                                    color: leave.color,
                                    border: `1px solid ${leave.color}2A`,
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {leave.tag}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. RECENT ACTIVITIES FEED */}
                {isCardRecentActivitiesVisible && (
                  <div className="org-card" style={{ flex: "0 0 auto" }}>
                    {/* Header */}
                    <div
                      style={{
                        padding: "9px 16px",
                        borderBottom: `1px solid ${token.colorBorderSecondary}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 6,
                            background: `${token.colorPrimary}18`,
                            border: `1px solid ${token.colorPrimary}30`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: token.colorPrimary,
                            fontSize: 12,
                          }}
                        >
                          <FireOutlined />
                        </div>
                        <Text strong style={{ fontSize: 13, color: token.colorText }}>
                          Live Activity Stream
                        </Text>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span className="org-pulse-dot" />
                        <span style={{ fontSize: 10.5, color: token.colorTextTertiary, fontWeight: 600 }}>
                          Real-time
                        </span>
                      </div>
                    </div>

                    {/* Content Feed */}
                    <div style={{ padding: "6px 14px 8px 14px" }}>
                      {!dashboardData.recentActivities ||
                        dashboardData.recentActivities.length === 0 ? (
                        <div
                          style={{
                            padding: "14px 10px",
                            textAlign: "center",
                            color: token.colorTextTertiary,
                            fontSize: 11.5,
                          }}
                        >
                          No recent activities.
                        </div>
                      ) : (
                        <div
                          className="org-slim-scroll"
                          style={{
                            maxHeight: 140,
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                          }}
                        >
                          {dashboardData.recentActivities.slice(0, 10).map((item, idx) => (
                            <div
                              key={item.id || idx}
                              className="org-hover-row"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "6px 9px",
                                borderRadius: 6,
                                gap: 8,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  minWidth: 0,
                                }}
                              >
                                <Avatar
                                  size={24}
                                  style={{
                                    backgroundColor: token.colorPrimaryBg || "#EFF6FF",
                                    color: token.colorPrimary,
                                    fontSize: 10.5,
                                    fontWeight: 700,
                                    border: `1px solid ${token.colorPrimary}25`,
                                    flexShrink: 0,
                                  }}
                                >
                                  {item.avatar || item.user?.[0] || "U"}
                                </Avatar>

                                <div
                                  style={{
                                    fontSize: 12,
                                    color: token.colorText,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  <strong style={{ fontWeight: 600 }}>{item.user}</strong>{" "}
                                  <span style={{ color: token.colorTextSecondary }}>
                                    {item.action}
                                  </span>{" "}
                                  {item.target && (
                                    <strong style={{ fontWeight: 600, color: token.colorPrimary }}>
                                      {item.target}
                                    </strong>
                                  )}
                                </div>
                              </div>

                              <span
                                style={{
                                  fontSize: 10.5,
                                  color: token.colorTextTertiary,
                                  fontWeight: 500,
                                  whiteSpace: "nowrap",
                                  flexShrink: 0,
                                }}
                              >
                                {formatTimeAgo(item.time)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Col>
          )}
        </Row>
      ) : null}
    </div>
  );
}

export default function Organization({
  dashboardSettings,
}: {
  dashboardSettings?: any;
}) {
  return (
    <Suspense fallback={<ZukvoLoader message="Loading organization..." />}>
      <DashboardContent dashboardSettings={dashboardSettings} />
    </Suspense>
  );
}
