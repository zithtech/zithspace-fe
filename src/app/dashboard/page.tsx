"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { TicketDetailDrawer } from "@/components/projects/drawer/TicketDetailDrawer";
import MainLayout from "@/components/layout/MainLayout";
import { ProjectService } from "@/services/projectService";

import {
  dashboardService,
  DashboardData,
} from "@/services/dashboardService";
import { useCalendar } from "@/hooks/useCalendar";
import { CalendarService, CalendarProvider } from "@/services/calendarService";
import { DailyUpdateService } from "@/services/dailyUpdateService";
import TicketService from "@/services/ticketService";
import { AttendanceService } from "@/services/attendanceService";
import BreakPickerModal from "@/components/attendance/BreakPickerModal";
import { breakLabel } from "@/components/attendance/breakTypes";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import Organization from "@/components/organaization/Organization";
import { ManualCreateTicketModal } from "@/components/projects/ManualCreateTicketModal";
import LeadService from "@/services/leadService";
import InvoiceService from "@/services/invoiceService";
import { ClientV2Service } from "@/services/clientV2Service";
import LeaveV2Service from "@/services/leaveV2Service";
import PayrollV2Service, { PayPayslip } from "@/services/payrollV2Service";
import { useSocket } from "@/providers/SocketProvider";
import { usePermission } from "@/hooks/usePermission";
import {
  Drawer,
  Form,
  Switch,
  message,
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
  Select,
} from "antd";
import {
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  CalendarOutlined,
  FileTextOutlined,
  VideoCameraOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CaretRightOutlined,
  FilePdfFilled,
  DownloadOutlined,
  CheckSquareOutlined,
  CoffeeOutlined,
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
  SafetyCertificateFilled,
  GiftOutlined
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import ZukvoLoader from "@/components/common/ZukvoLoader";

const { Title, Text } = Typography;

function DashboardContent() {
  const { token } = theme.useToken();
  const { user, hasAnySubscriptionFeature } = useAuth();
  const { canUpdateSettings } = usePermission();
  const { socket } = useSocket();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardSettings, setDashboardSettings] = useState<any>(null);
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
  const [breakModalOpen, setBreakModalOpen] = useState(false);
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [isCreateTicketModalOpen, setIsCreateTicketModalOpen] = useState(false);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [createdInvoices, setCreatedInvoices] = useState<any[]>([]);
  const [clientStats, setClientStats] = useState({ active: 0, total: 0 });

  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [payslips, setPayslips] = useState<PayPayslip[]>([]);
  const [selectedPayslipId, setSelectedPayslipId] = useState<string | null>(null);

  const [userProjects, setUserProjects] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      ProjectService.getProjects({ limit: 100, userId: user.id })
        .then((res) => {
          const filtered = (res.data || []).filter(
            (p: any) =>
              p.projectManagerId === user.id ||
              (p.members && p.members.some((m: any) => m.user?.id === user.id))
          );
          setUserProjects(filtered);
          if (filtered.length > 0 && !selectedProjectId) {
            setSelectedProjectId(filtered[0].id || (filtered[0] as any)._id);
          }
        })
        .catch((err) => console.error("Failed to fetch user projects", err));
    }
  }, [user]);

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  useEffect(() => {

    console.log("recentTickets", recentTickets);
  }, [recentTickets]);

  const [workDuration, setWorkDuration] = useState("00:00:00");

  useEffect(() => {
    // Worked time excludes breaks: sum of closed sessions + the live open one.
    const compute = () => {
      const a = todayAttendance;
      if (!a) {
        setWorkDuration("00:00:00");
        return;
      }
      const sessions: any[] = Array.isArray(a.sessions) ? a.sessions : [];
      const closedSec = sessions
        .filter((s) => !s.isOpen)
        .reduce((acc, s) => acc + (s.workMinutes || 0) * 60, 0);
      const open = sessions.find((s) => s.isOpen);
      let totalSec: number;
      if (open && open.clockIn) {
        totalSec = closedSec + Math.max(0, Math.floor((Date.now() - new Date(open.clockIn).getTime()) / 1000));
      } else {
        totalSec = (a.totalWorkMinutes ?? 0) * 60;
      }
      const hours = Math.floor(totalSec / 3600).toString().padStart(2, "0");
      const minutes = Math.floor((totalSec % 3600) / 60).toString().padStart(2, "0");
      const seconds = Math.floor(totalSec % 60).toString().padStart(2, "0");
      setWorkDuration(`${hours}:${minutes}:${seconds}`);
    };

    compute();
    const sessions: any[] = Array.isArray(todayAttendance?.sessions) ? todayAttendance.sessions : [];
    const hasOpen = sessions.some((s) => s.isOpen);
    const interval = hasOpen ? setInterval(compute, 1000) : undefined;
    return () => {
      if (interval) clearInterval(interval);
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

  // Filter today's meetings (backend already expands recurring events)
  const todaysMeetings = calendarEvents.reduce((acc: any[], event: any) => {
    // Filter: User must be an attendee or the creator (case-insensitive)
    const isUserAttendee =
      (Array.isArray(event.attendees) && event.attendees.some((email: any) => typeof email === 'string' && email.toLowerCase() === user?.email?.toLowerCase())) ||
      event.userId === user?.id;
    if (!isUserAttendee) return acc;

    const today = dayjs().startOf("day");
    const start = dayjs(event.startTime);
    const exdates = Array.isArray(event.exdate)
      ? event.exdate
      : event.exdate
        ? [event.exdate]
        : [];

    // Direct match
    if (start.isSame(today, "day")) {
      const isExcluded = exdates.some((ex: string) =>
        dayjs(ex).isSame(today, "day"),
      );
      if (!isExcluded) {
        // Prevent duplicate entries for the same series or event ID
        const isDuplicate = acc.some((m: any) => {
          let mMasterId = null;
          if (m.rrule) {
            try {
              const parsed = JSON.parse(m.rrule);
              mMasterId = parsed.seriesMasterId;
            } catch (e) { }
          }
          const mCleanExternalId = mMasterId || m.externalId?.split('_occ_')[0]?.split('_RID')[0];
          const cleanExternalId = event.externalId?.split('_occ_')[0]?.split('_RID')[0];
          return mCleanExternalId === cleanExternalId || m.id === event.id || m.externalId === event.externalId;
        });
        if (!isDuplicate) {
          acc.push(event);
        }
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
    if (dashboardSettings?.cardSalarySlip !== false) {
      const fetchPayslips = async () => {
        try {
          const res = await PayrollV2Service.getMyPayslips({ page: 1, limit: 10 });
          const items = Array.isArray(res) ? res : (res?.data ?? []);
          setPayslips(items);
          if (items.length > 0) setSelectedPayslipId(items[0].id);
        } catch (e) {
          console.error("Failed to fetch payslips", e);
        }
      };
      fetchPayslips();
    }
  }, [dashboardSettings?.cardSalarySlip]);

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

    window.addEventListener("attendance:refresh", fetchTodayAttendance);
    if (socket) {
      socket.on("attendance:updated", fetchTodayAttendance);
    }

    return () => {
      window.removeEventListener("attendance:refresh", fetchTodayAttendance);
      if (socket) {
        socket.off("attendance:updated", fetchTodayAttendance);
      }
    };
  }, [user, socket]);

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
    const fetchDashboardSettings = async () => {
      if (user) {
        try {
          const data = await dashboardService.getSettings();
          if (data && data.visibleCards) {
            setDashboardSettings(data.visibleCards);
          } else {
            // Default settings if null
            setDashboardSettings({
              heroSection: true,
              quickActions: true,
              attendanceStats: true,
              myTicketsProgress: true,
              recentTickets: true,
              freelancerStats: true,
              recentLeads: true,
              recentInvoices: true,
              calendar: true,
            });
          }
        } catch (error) {
          console.error("Failed to fetch dashboard settings", error);
        }
      }
    };

    fetchDashboardSettings();
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
            limit: 1000,
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
        return "#EF4444";
      case "medium":
        return "#10B981";
      case "low":
        return "#10B981";
      default:
        return "#94A3B8";
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

  const handlePause = async (breakType?: string, reason?: string) => {
    setIsClocking(true);
    try {
      const r = await AttendanceService.pause({ breakType, reason });
      setTodayAttendance(r);
    } catch (error) {
      console.error("Failed to pause", error);
      setError("Failed to start break. Please try again.");
    } finally {
      setIsClocking(false);
    }
  };

  const handleResume = async () => {
    setIsClocking(true);
    try {
      const r = await AttendanceService.resume();
      setTodayAttendance(r);
    } catch (error) {
      console.error("Failed to resume", error);
      setError("Failed to resume. Please try again.");
    } finally {
      setIsClocking(false);
    }
  };

  const handleComplete = async () => {
    setIsClocking(true);
    try {
      const r = await AttendanceService.complete();
      setTodayAttendance(r);
    } catch (error) {
      console.error("Failed to complete the day", error);
      setError("Failed to complete the day. Please try again.");
    } finally {
      setIsClocking(false);
    }
  };

  // Day-state derived from the new multi-session payload (with legacy fallback).
  const attState: string =
    todayAttendance?.state ??
    (todayAttendance?.canClockIn
      ? "not_started"
      : todayAttendance?.canClockOut
        ? "working"
        : todayAttendance
          ? "complete"
          : "not_started");
  const isWorking = attState === "working";
  const isPaused = attState === "paused";
  const isComplete = attState === "complete";
  const notStarted = attState === "not_started";

  // ─── Premium Layout Helpers ───────────────────────────────────────────
  const hour = dayjs().hour();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName =
    user?.name?.split(" ")[0] || user?.name || "there";

  const heroSubtext = isWorking
    ? `You're clocked in — ${workDuration} worked today.`
    : isPaused
      ? `On a break${todayAttendance?.breakType ? ` · ${breakLabel(todayAttendance.breakType)}` : ""} — resume when you're ready.`
      : isComplete
        ? "Shift wrapped — nice work today."
        : todayAttendance
          ? "Ready when you are. Clock in to start your day."
          : "Here's a quick look at what's on your plate.";

  // Filter tickets by selected project if one is selected
  const displayedTickets = selectedProjectId
    ? tickets.filter((t) => {
      const pId = t.projectId || (typeof t.project === 'string' ? t.project : (t.project?.id || t.project?._id));
      return pId === selectedProjectId;
    })
    : tickets;

  const totalTickets = displayedTickets.length;
  const completedTickets = displayedTickets.filter((t) =>
    ["completed", "live", "done"].includes(t.status?.toLowerCase()),
  ).length;
  const inProgressTickets = displayedTickets.filter(
    (t) =>
      t.status?.toLowerCase() === "in_progress" ||
      t.status?.toLowerCase() === "doing",
  ).length;
  const notStartedTickets = displayedTickets.filter(
    (t) => t.status?.toLowerCase() === "not_started",
  ).length;
  const inTestingTickets = displayedTickets.filter(
    (t) =>
      ["in_testing", "testing", "live_testing", "live testing"].includes(t.status?.toLowerCase()),
  ).length;
  const completionRate =
    totalTickets > 0
      ? Math.round((completedTickets / totalTickets) * 100)
      : 0;

  const cardBase: React.CSSProperties = {
    borderRadius: 12,
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
    onClick,
  }: {
    eyebrow: string;
    value: React.ReactNode;
    trend?: string;
    trendTone?: "positive" | "neutral" | "warning";
    icon: React.ReactNode;
    accent: string;
    subtle?: string;
    chart?: React.ReactNode;
    onClick?: () => void;
  }) => {
    const trendColors: Record<string, { bg: string; fg: string }> = {
      positive: { bg: token.colorSuccessBg, fg: token.colorSuccessTextHover || token.colorSuccess },
      neutral: { bg: token.colorFillAlter, fg: token.colorTextSecondary },
      warning: { bg: token.colorWarningBg, fg: token.colorWarningTextHover || token.colorWarning },
    };
    const tc = trendColors[trendTone];
    return (
      <div
        className="hover-scale"
        style={{ background: token.colorBgContainer, borderRadius: 10, border: `1px solid ${token.colorBorderSecondary}`, padding: "8px 12px", cursor: onClick ? "pointer" : "default", display: "flex", flexDirection: "column", gap: 6, height: "100%" }}
        onClick={onClick}
      >
        {/* Top row: icon + eyebrow + arrow */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 20, height: 20, borderRadius: 4,
                background: `${accent}14`,
                border: `1px solid ${accent}33`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: accent, fontSize: 10,
              }}
            >
              {icon}
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, color: token.colorTextSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {eyebrow}
            </span>
          </div>
          <ArrowRightOutlined style={{ color: token.colorTextTertiary, fontSize: 9 }} />
        </div>

        {/* Value and subtle */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: token.colorText, lineHeight: 1 }}>{value}</span>
          </div>
          {/* Subtle row */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {trend && (
              <span style={{ fontSize: 9, fontWeight: 700, color: tc.fg, background: tc.bg, padding: "1px 4px", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 2 }}>
                {trend}
              </span>
            )}
            {subtle && <span style={{ fontSize: 9, color: token.colorTextTertiary, fontWeight: 500 }}>{subtle}</span>}
          </div>
        </div>

        {/* Mini chart below */}
        {chart && <div style={{ marginTop: 0 }}>{chart}</div>}
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

  const isHeroVisible = dashboardSettings?.heroSection !== false;
  const isQuickActionsVisible = dashboardSettings?.quickActions !== false;
  const isAttendanceStatsVisible = dashboardSettings?.attendanceStats !== false && hasAnySubscriptionFeature("my_hub_my_hub_general_attendance", "hrms_attendance");
  const isMyTicketsVisible = dashboardSettings?.myTicketsProgress !== false && hasAnySubscriptionFeature("work_projects");
  const isRecentTicketsVisible = dashboardSettings?.recentTickets !== false && hasAnySubscriptionFeature("work_projects");
  const isFreelancerStatsVisible = dashboardSettings?.freelancerStats !== false && hasAnySubscriptionFeature("work_squad");
  const isRecentLeadsVisible = dashboardSettings?.recentLeads !== false && hasAnySubscriptionFeature("crm_leads");
  const isRecentInvoicesVisible = dashboardSettings?.recentInvoices !== false && hasAnySubscriptionFeature("finance_invoice");
  const isCalendarVisible = dashboardSettings?.calendar !== false && hasAnySubscriptionFeature("home_home_general_calendar");
  const isCardSalarySlipVisible = dashboardSettings?.cardSalarySlip !== false && hasAnySubscriptionFeature("hrms_payroll_v2", "hrms_payroll");
  const isDailyAttendanceVisible = dashboardSettings?.dailyAttendanceCard !== false && hasAnySubscriptionFeature("my_hub_my_hub_general_attendance", "hrms_attendance");
  const isMetricDailyUpdatesVisible = dashboardSettings?.metricDailyUpdates !== false && hasAnySubscriptionFeature("work_daily_updates");
  const isMetricAvgHoursVisible = dashboardSettings?.metricAvgHours !== false && hasAnySubscriptionFeature("work_time_tracking");
  const isMetricMyTicketsVisible = dashboardSettings?.metricMyTickets !== false && hasAnySubscriptionFeature("work_projects");
  const isMetricTeamTodayVisible = dashboardSettings?.metricTeamToday !== false && hasAnySubscriptionFeature("hrms_attendance", "my_hub_my_hub_general_attendance");

  // ─── Today Leaves render ──────────────────────────────────────────

  // ─── Salary Slip render ───────────────────────────────────────────
  const renderSalarySlip = () => {
    if (payslips.length === 0) {
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: `linear-gradient(135deg, ${token.colorFillAlter} 0%, transparent 100%)`, display: "flex", alignItems: "center", justifyContent: "center", color: token.colorTextTertiary, marginBottom: 12 }}>
            <FileTextOutlined style={{ fontSize: 20 }} />
          </div>
          <Text strong style={{ fontSize: 13, color: token.colorText, display: "block", marginBottom: 4 }}>No Salary Slips</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>You have no salary slips available yet.</Text>
        </div>
      );
    }

    const selectedSlip = payslips.find(p => p.id === selectedPayslipId) || payslips[0];

    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <Text strong style={{ fontSize: 16 }}>Salary Slip</Text>
          <Select
            size="small"
            value={selectedSlip.id}
            onChange={(val) => setSelectedPayslipId(val)}
            style={{ width: 130 }}
            options={payslips.map(p => ({ label: p.periodLabel || `${p.month}/${p.year}`, value: p.id }))}
          />
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <div style={{
            width: 90, height: 90, borderRadius: 16, background: `${token.colorError}15`,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <FilePdfFilled style={{ fontSize: 40, color: token.colorError }} />
          </div>
          <Text style={{ fontSize: 13, color: token.colorTextSecondary }}>
            Salary-Slip of {selectedSlip.periodLabel || `${selectedSlip.month}/${selectedSlip.year}`}
          </Text>
        </div>

        <Button
          type="primary"
          icon={<DownloadOutlined />}
          style={{ width: "100%", marginTop: 24, borderRadius: 8, height: 40, background: "#4338CA", borderColor: "#4338CA" }}
          onClick={() => {
            if (selectedSlip.fileUrl) {
              const fileName = `Salary_Slip_${selectedSlip.periodLabel || `${selectedSlip.month}_${selectedSlip.year}`}.pdf`;
              const proxyUrl = `/api/download-proxy?url=${encodeURIComponent(selectedSlip.fileUrl)}&filename=${encodeURIComponent(fileName)}`;
              const a = document.createElement("a");
              a.href = proxyUrl;
              a.download = fileName;
              document.body.appendChild(a);
              a.click();
              a.remove();
            }
          }}
          disabled={!selectedSlip.fileUrl}
        >
          Download
        </Button>
      </div>
    );
  };

  return (
    <MainLayout>
      <style>{`
        .ant-card-head {
          border-bottom: none !important;
        }
      `}</style>
      <div
        style={{
          margin: "0 -24px",
          padding: "12px 32px 28px",
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
            gap: 12,
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 260 }}>
            {isHeroVisible && (
              <>
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
                      fontSize: 22,
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
              </>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                  accent: "#3B82F6",
                  accentLight: "#60A5FA",
                },
                {
                  value: "organization" as const,
                  title: "Organization",
                  icon: <TeamOutlined />,
                  accent: "#3B82F6",
                  accentLight: "#60A5FA",
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
                        "--switch-grad": opt.accent,
                        "--switch-glow": "transparent",
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
            {user?.role === 'super_admin' && (
              <Button
                type="text"
                icon={<SettingOutlined />}
                onClick={() => router.push('/dashboard/settings')}
                style={{ borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              />
            )}
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
                style={{ marginBottom: 12, borderRadius: 12 }}
              />
            )}
            {calendarError && (
              <Alert
                message="Calendar Error"
                description={calendarError}
                type="error"
                showIcon
                closable
                style={{ marginBottom: 12, borderRadius: 12 }}
              />
            )}
            {calendarSuccess && (
              <Alert
                message="Success"
                description={calendarSuccess}
                type="success"
                showIcon
                closable
                style={{ marginBottom: 12, borderRadius: 12 }}
              />
            )}

            {loading ? (
              <>
                <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
                  {[1, 2, 3, 4].map((i) => (
                    <Col xs={24} sm={12} lg={6} key={i}>
                      <Card
                        size="small"
                        style={{ ...cardBase }}
                        styles={{ body: { padding: 14 } }}
                      >
                        <Skeleton active paragraph={{ rows: 1 }} />
                      </Card>
                    </Col>
                  ))}
                </Row>
                <Row gutter={[12, 12]}>
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
                {(() => {
                  const visibleMetrics = [
                    isMetricDailyUpdatesVisible,
                    isMetricAvgHoursVisible,
                    isMetricMyTicketsVisible,
                    isMetricTeamTodayVisible
                  ].filter(Boolean).length;
                  const metricsSpan = visibleMetrics === 1 ? 24 : visibleMetrics === 2 ? 12 : visibleMetrics === 3 ? 8 : 6;

                  return (
                    <Row gutter={[12, 12]} align="stretch" style={{ marginBottom: 12 }}>
                      {/* 1. My Tickets */}
                      {isMetricMyTicketsVisible && (
                        <Col xs={24} sm={12} lg={metricsSpan}>
                          {(() => {
                            const closed = myTicketsStats.closed;
                            const totalT = myTicketsStats.total;
                            const open = Math.max(0, totalT - closed);
                            const accent = "#3B82F6";
                            return (
                              <KpiCard
                                eyebrow="My Tickets"
                                value={`${closed} / ${totalT}`}
                                icon={<CheckSquareOutlined />}
                                accent="#3B82F6"
                                subtle="Open / Closed"
                                chart={<Progress percent={totalT > 0 ? Math.round((closed / totalT) * 100) : 0} showInfo={false} size="small" strokeColor="#3B82F6" trailColor="#EFF6FF" />}
                                onClick={() => router.push("/tickets/select")}
                              />
                            );
                          })()}
                        </Col>
                      )}

                      {/* 2. Avg Working Hours */}
                      {isMetricAvgHoursVisible && (
                        <Col xs={24} sm={12} lg={metricsSpan}>
                          {(() => {
                            const [hh = 0, mm = 0] = String(averageWorkHours || "0:0:0")
                              .split(":")
                              .map((n) => Number(n) || 0);
                            const hoursDecimal = hh + mm / 60;
                            const pct = Math.min(100, Math.round((hoursDecimal / 8) * 100));
                            const accent = "#3B82F6";
                            return (
                              <KpiCard
                                eyebrow="Avg Hours"
                                value={averageWorkHours}
                                icon={<ClockCircleOutlined />}
                                accent="#10B981"
                                trend={`▼ ${pct}%`}
                                trendTone="warning"
                                subtle="vs 5d"
                                onClick={() => router.push("/my-hub/attendance")}
                              />
                            );
                          })()}
                        </Col>
                      )}

                      {/* 3. Daily Attendance (BOD / EOD original spot) */}
                      {isMetricDailyUpdatesVisible && (
                        <Col xs={24} sm={12} lg={metricsSpan}>
                          {(() => {
                            const clockInTime = todayAttendance?.clockInTime;
                            const attendanceStatus = isWorking
                              ? "Active"
                              : isPaused
                                ? "On Break"
                                : isComplete
                                  ? "Completed"
                                  : notStarted
                                    ? "Not Started"
                                    : "Present";
                            const statusColor = isWorking || (!notStarted && !isComplete)
                              ? "#10B981"
                              : isComplete
                                ? "#3B82F6"
                                : "#94A3B8";
                            const subtleText = clockInTime
                              ? `In at ${dayjs(clockInTime).format("h:mm A")}`
                              : notStarted
                                ? "Not clocked in yet"
                                : "Today's attendance";
                            return (
                              <KpiCard
                                eyebrow="Daily Attendance"
                                value={
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#1E293B" }}>
                                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor, display: "inline-block" }} />
                                    {attendanceStatus}
                                  </span>
                                }
                                icon={<SyncOutlined />}
                                accent="#8B5CF6"
                                subtle={subtleText}
                                onClick={() => router.push("/my-hub/attendance")}
                              />
                            );
                          })()}
                        </Col>
                      )}

                      {/* 4. Team Today (Today's Attendance) */}
                      {isMetricTeamTodayVisible && (
                        <Col xs={24} sm={12} lg={metricsSpan}>
                          {(() => {
                            const present = dashboardData.stats.attendance.present;
                            const total = dashboardData.stats.totalMembers;
                            const absent = Math.max(0, total - present);
                            return (
                              <KpiCard
                                eyebrow="Team Today"
                                value={`${present} / ${total}`}
                                icon={<TeamOutlined />}
                                accent="#8B5CF6"
                                subtle="Working / On Leave"
                                onClick={() => router.push("/attendance")}
                              />
                            );
                          })()}
                        </Col>
                      )}
                    </Row>
                  );
                })()}

                {/* ─── Main Grid ──────────────────────────────────── */}
                {(() => {
                  const visibleKeys = [
                    isDailyAttendanceVisible && "attendance",
                    isCalendarVisible && "calendar",
                    isQuickActionsVisible && "quickActions",
                    isCardSalarySlipVisible && "salarySlip",
                    isMyTicketsVisible && "tickets",
                    isRecentTicketsVisible && "recentTickets"
                  ].filter(Boolean) as string[];
                  void visibleKeys;

                  return (
                    <>
                      {/* ─── Middle Row: Left=Meetings (16), Right=Quick Actions+Attendance (8) ─── */}
                      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>

                        {/* LEFT COL: Today's Meetings */}
                        <Col xs={24} lg={10}>
                          {isCalendarVisible ? (
                            <Card
                              style={{ ...cardBase, minHeight: 250, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}
                              styles={{ body: { padding: 0, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", zIndex: 1 } }}
                              title={
                                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `#3B82F614`, border: `1px solid #3B82F633`, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#3B82F6", fontSize: 13, flexShrink: 0 }}>
                                    <VideoCameraOutlined />
                                  </div>
                                  <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                                    <span style={{ fontSize: 14, fontWeight: 600, color: token.colorText, letterSpacing: "-0.1px", lineHeight: 1.2 }}>Today's Meetings</span>
                                    <span style={{ fontSize: 11, color: token.colorTextSecondary, fontWeight: 400 }}>Your scheduled meetings for today.</span>
                                  </div>
                                </div>
                              }
                              extra={
                                connectedProvider ? (
                                  <Space size={4}>
                                    <Button type="text" size="small" icon={<SyncOutlined style={{ fontSize: 11 }} />} onClick={() => syncCalendar(connectedProvider)} loading={calendarSyncing} style={{ fontSize: 11 }}>Sync</Button>
                                    <Button type="link" size="small" onClick={() => router.push("/calendar")} style={{ fontSize: 11, fontWeight: 600 }}>View All →</Button>
                                  </Space>
                                ) : (
                                  <Button type="link" size="small" onClick={() => router.push("/integrations")} style={{ fontSize: 11 }}>Connect →</Button>
                                )
                              }
                            >
                              <div style={{ flex: 1, overflowY: "auto", padding: 0, position: "relative", zIndex: 1 }} className="no-scrollbar">
                                {calendarLoading ? (
                                  <div style={{ padding: 16 }}><Skeleton active paragraph={{ rows: 3 }} /></div>
                                ) : !connectedProvider ? (
                                  <div style={{ padding: "40px 24px", textAlign: "center" }}>
                                    <div style={{ width: 52, height: 52, borderRadius: 14, background: token.colorFillAlter, margin: "0 auto 12px", display: "inline-flex", alignItems: "center", justifyContent: "center", color: token.colorTextTertiary }}>
                                      <VideoCameraOutlined style={{ fontSize: 22 }} />
                                    </div>
                                    <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 12 }}>Connect your calendar to see today's meetings</Text>
                                    <Button type="primary" size="small" onClick={() => router.push("/integrations")} style={{ borderRadius: 8 }}>Connect Calendar</Button>
                                  </div>
                                ) : todaysMeetings.length > 0 ? (
                                  (() => {
                                    const now = dayjs();
                                    const sorted = [...todaysMeetings].sort((a: any, b: any) => dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf());
                                    const isLiveMtg = (m: any) => dayjs(m.startTime).isBefore(now) && dayjs(m.endTime).isAfter(now);
                                    const liveMeeting = sorted.find(isLiveMtg);
                                    const upcoming = sorted.filter((m: any) => dayjs(m.startTime).isAfter(now));
                                    const heroMeeting = liveMeeting || upcoming[0];
                                    const restMeetings = sorted.filter((m: any) => m !== heroMeeting);
                                    const formatRelative = (m: any) => {
                                      const s = dayjs(m.startTime);
                                      const e = dayjs(m.endTime);
                                      if (s.isBefore(now) && e.isAfter(now)) return `${e.diff(now, "minute")}m left`;
                                      if (s.isAfter(now)) { const diff = s.diff(now, "minute"); if (diff < 60) return `in ${diff}m`; const h = Math.floor(diff / 60); const mm = diff % 60; return mm ? `in ${h}h ${mm}m` : `in ${h}h`; }
                                      return "Finished";
                                    };
                                    return (
                                      <div style={{ display: "flex", flexDirection: "column" }}>
                                        {heroMeeting && (
                                          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${token.colorBorderSecondary}`, background: liveMeeting ? token.colorPrimaryBg : "transparent" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                              {liveMeeting && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3B82F6", animation: "pulse 2s infinite" }} />}
                                              <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.4px" }}>
                                                {liveMeeting ? "● LIVE NOW" : `UP NEXT · ${formatRelative(heroMeeting)}`}
                                              </Text>
                                            </div>
                                            <Text strong style={{ fontSize: 14, display: "block", color: token.colorText, marginBottom: 2 }}>{heroMeeting.title}</Text>
                                            <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(heroMeeting.startTime).format("h:mm A")} – {dayjs(heroMeeting.endTime).format("h:mm A")}</Text>
                                          </div>
                                        )}
                                        {restMeetings.map((m: any) => (
                                          <div key={m.id} style={{ padding: "12px 20px", display: "flex", alignItems: "center", gap: 14, borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
                                            <div style={{ width: 3, height: 36, borderRadius: 999, background: "#3B82F6", flexShrink: 0 }} />
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                              <Text style={{ fontSize: 13, display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 500 }}>{m.title}</Text>
                                              <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(m.startTime).format("h:mm A")} – {dayjs(m.endTime).format("h:mm A")}</Text>
                                            </div>
                                            <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>{formatRelative(m)}</Text>
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  })()
                                ) : (
                                  <div style={{ padding: "40px 24px", textAlign: "center" }}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>No meetings scheduled for today.</Text>
                                  </div>
                                )}
                              </div>
                            </Card>
                          ) : (
                            <div style={{ minHeight: 250 }} />
                          )}
                        </Col>

                        {/* Daily Updates */}
                        {isMetricDailyUpdatesVisible && (
                          <Col xs={24} md={12} lg={7}>
                            <Card
                              style={{ ...cardBase, height: "100%" }}
                              styles={{ body: { padding: 12, height: "100%", display: "flex", flexDirection: "column" } }}
                              title={
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <div style={{ width: 30, height: 30, borderRadius: 8, background: "#F59E0B14", border: "1px solid #F59E0B33", display: "flex", alignItems: "center", justifyContent: "center", color: "#F59E0B", fontSize: 16 }}>
                                      <ThunderboltFilled />
                                    </div>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: token.colorText, letterSpacing: "-0.2px" }}>Daily Updates</span>
                                  </div>
                                  <Button type="link" size="small" onClick={() => router.push("/daily-updates/submit")} style={{ fontSize: 12, fontWeight: 600, letterSpacing: "-0.1px" }}>View All</Button>
                                </div>
                              }
                            >
                              <div style={{ display: "flex", gap: 8 }}>
                                {[
                                  { label: "BOD", state: todayUpdates.bod, date: "Today · " + dayjs().format("MMM DD") },
                                  { label: "EOD", state: todayUpdates.eod, date: "Today · " + dayjs().format("MMM DD") },
                                ].map((item) => (
                                  <div
                                    key={item.label}
                                    style={{ flex: 1, minWidth: 0, padding: "12px", borderRadius: 10, background: item.state ? "#10B98114" : token.colorBgContainer, border: `1px solid ${item.state ? "#10B98133" : token.colorBorderSecondary}`, display: "flex", flexDirection: "column", gap: 6 }}
                                  >
                                    <Text style={{ fontSize: 11, fontWeight: 700, color: token.colorTextSecondary, letterSpacing: "1px" }}>{item.label}</Text>
                                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: item.state ? token.colorSuccess : token.colorWarning }}>
                                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: item.state ? "#10B981" : "#F59E0B", display: "inline-block" }} />
                                      {item.state ? "Submitted" : "Pending"}
                                    </div>
                                    <Text style={{ fontSize: 11, color: token.colorTextTertiary }}>{item.date}</Text>
                                  </div>
                                ))}
                              </div>
                            </Card>
                          </Col>
                        )}

                        {/* RIGHT COL: Quick Actions */}
                        <Col xs={24} md={12} lg={7}>

                          {/* Quick Actions */}
                          {isQuickActionsVisible && (() => {
                            const accentQA = "#10B981";
                            const quickActions = [
                              { icon: <PlusCircleOutlined />, title: "Create Ticket", desc: "Log a new task or issue", accent: "#3B82F6", onClick: () => setIsCreateTicketModalOpen(true) },
                              { icon: <FormOutlined />, title: "Submit Updates", desc: "BOD / EOD", accent: "#8B5CF6", onClick: () => router.push("/daily-updates") },
                              { icon: <FolderOpenOutlined />, title: "Document Hub", desc: "Access company files", accent: "#10B981", onClick: () => router.push("/documenthub") },
                              { icon: <AppstoreOutlined />, title: "Projects", desc: "Manage your projects", accent: "#F59E0B", onClick: () => router.push("/projects/manage") },
                            ];
                            return (
                              <Card
                                style={{ ...cardBase, position: "relative", overflow: "hidden", height: "100%" }}
                                styles={{ body: { padding: 12, position: "relative", zIndex: 1 } }}
                                title={
                                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                      <div style={{ width: 30, height: 30, borderRadius: 8, background: `${accentQA}14`, border: `1px solid ${accentQA}33`, display: "flex", alignItems: "center", justifyContent: "center", color: "#10B981", fontSize: 16 }}>
                                        <ThunderboltFilled />
                                      </div>
                                      <span style={{ fontSize: 14, fontWeight: 700, color: token.colorText, letterSpacing: "-0.2px" }}>Quick Actions</span>
                                    </div>
                                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.4px", color: accentQA, background: `${accentQA}14`, border: `1px solid ${accentQA}33`, padding: "2px 7px", borderRadius: 999 }}>SHORTCUTS</span>
                                  </div>
                                }
                              >
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                  {quickActions.map((a) => (
                                    <div
                                      key={a.title}
                                      onClick={a.onClick}
                                      className="dash-qa-row hover-scale"
                                      style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8, padding: "10px 10px", borderRadius: 10, border: `1px solid ${token.colorBorderSecondary}`, background: token.colorBgContainer, position: "relative", overflow: "hidden" }}
                                    >
                                      <div style={{ width: 30, height: 30, borderRadius: 8, background: `${a.accent}10`, display: "inline-flex", alignItems: "center", justifyContent: "center", color: a.accent, fontSize: 14, flexShrink: 0 }}>{a.icon}</div>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <Text strong style={{ fontSize: 12, color: token.colorText, display: "block", lineHeight: 1.2, letterSpacing: "-0.2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.title}</Text>
                                        <Text type="secondary" style={{ fontSize: 10, lineHeight: 1.2, color: token.colorTextSecondary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.desc}</Text>
                                      </div>
                                      <ArrowRightOutlined style={{ fontSize: 10, color: token.colorTextTertiary, flexShrink: 0 }} />
                                    </div>
                                  ))}
                                </div>
                              </Card>
                            );
                          })()}

                        </Col>
                      </Row>

                      <BreakPickerModal open={breakModalOpen} loading={isClocking} onCancel={() => setBreakModalOpen(false)} onConfirm={async (bt, r) => { await handlePause(bt, r); setBreakModalOpen(false); }} />



                      {/* Salary Slip full-width row */}
                      {isCardSalarySlipVisible && (
                        <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
                          <Col xs={24}>
                            <Card style={{ ...cardBase, minHeight: 200, display: "flex", flexDirection: "column" }} styles={{ body: { padding: 0, flex: 1, display: "flex", flexDirection: "column", minHeight: 0 } }}>
                              {renderSalarySlip()}
                            </Card>
                          </Col>
                        </Row>
                      )}

                      {/* ─── Bottom Row: Daily Updates | My Work Progress | Recent Tickets ─── */}
                      <Row gutter={[12, 12]} align="stretch">

                        {/* MIDDLE COL: Daily Updates */}
                        {isDailyAttendanceVisible && (
                          <Col xs={24} md={12} lg={7}>
                            <Card
                              style={{ ...cardBase, background: isWorking ? token.colorPrimaryBg : isPaused ? "#FFFBEB" : token.colorBgContainer, overflow: "hidden", position: "relative", height: 250, display: "flex", flexDirection: "column" }}
                              styles={{ body: { padding: 10, display: "flex", flexDirection: "column", flex: 1 } }}
                              title={
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <div style={{ width: 30, height: 30, borderRadius: 8, background: "#EEF2FF", border: "1px solid #E0E7FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#4F46E5", fontSize: 16 }}>
                                      <ClockCircleOutlined />
                                    </div>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: token.colorText, letterSpacing: "-0.2px" }}>Daily Attendance</span>
                                  </div>
                                  <Button type="link" size="small" onClick={() => router.push("/my-hub/attendance")} style={{ fontSize: 12, fontWeight: 600, letterSpacing: "-0.1px" }}>View Details →</Button>
                                </div>
                              }
                            >
                              {todayAttendance ? (() => {
                                const TARGET_HOURS = 8;
                                const parts = (workDuration || "00:00:00").split(":");
                                const elapsedSec = (parseInt(parts[0] || "0", 10) || 0) * 3600 + (parseInt(parts[1] || "0", 10) || 0) * 60 + (parseInt(parts[2] || "0", 10) || 0);
                                const targetSec = TARGET_HOURS * 3600;
                                const progressPct = Math.min(100, Math.round((elapsedSec / targetSec) * 100));
                                const isActive = isWorking;
                                const ringColor = isWorking ? token.colorPrimary : isPaused ? "#F59E0B" : notStarted ? token.colorTextTertiary : "#10B981";
                                const wh = parts[0] || "0";
                                const wm = parts[1] || "0";
                                const totalBreakMin = todayAttendance?.totalBreakMinutes ?? 0;
                                const lateMin = todayAttendance?.lateMinutes ?? 0;
                                const earlyLeaveMin = todayAttendance?.earlyLeaveMinutes ?? 0;
                                return (
                                  <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                                    {/* Main Content (Circle + Breakdown) */}
                                    <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 12 }}>
                                      {/* Circular progress */}
                                      <div style={{ position: "relative", flexShrink: 0 }}>
                                        <Progress
                                          type="circle"
                                          percent={progressPct}
                                          size={94}
                                          strokeWidth={8}
                                          strokeLinecap="round"
                                          strokeColor={isActive ? { "0%": token.colorPrimary, "100%": "#3B82F6" } : ringColor}
                                          trailColor={token.colorFillAlter}
                                          format={() => (
                                            <div style={{ textAlign: "center" }}>
                                              <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1, color: isActive ? token.colorPrimary : token.colorText, letterSpacing: "-0.3px", fontVariantNumeric: "tabular-nums" }}>{wh}h {wm}m</div>
                                              <div style={{ fontSize: 9, color: token.colorTextTertiary, fontWeight: 600, marginTop: 4, letterSpacing: "-0.1px" }}>Total Hours</div>
                                            </div>
                                          )}
                                        />
                                      </div>

                                      {/* Breakdown rows */}
                                      <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 0 }}>
                                        {[
                                          { label: "Working", color: "#3B82F6", value: `${wh}h ${wm}m` },
                                          { label: "Break", color: "#10B981", value: totalBreakMin > 0 ? `${totalBreakMin}m` : "0m" },
                                          { label: "Late", color: "#F59E0B", value: lateMin > 0 ? `${lateMin}m` : "0m" },
                                          { label: "Early Leave", color: "#EF4444", value: earlyLeaveMin > 0 ? `${earlyLeaveMin}m` : "0m" },
                                        ].map((row) => (
                                          <div key={row.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: row.color, display: "inline-block", flexShrink: 0 }} />
                                              <Text style={{ fontSize: 12, color: token.colorTextSecondary, fontWeight: 500, letterSpacing: "-0.2px" }}>{row.label}</Text>
                                            </div>
                                            <Text strong style={{ fontSize: 13, fontVariantNumeric: "tabular-nums", color: token.colorText, letterSpacing: "-0.3px" }}>{row.value}</Text>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Separator */}
                                    <div style={{ height: 1, background: token.colorBorderSecondary, margin: "0 0 12px 0", flexShrink: 0 }} />

                                    {/* Action buttons */}
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 0 }}>
                                      {notStarted ? (
                                        <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleClockIn} loading={isClocking} style={{ borderRadius: 8, height: 36, fontWeight: 600, fontSize: 13, boxShadow: "none", border: "none", gridColumn: "1 / -1", letterSpacing: "-0.1px" }}>Start Workday</Button>
                                      ) : isComplete ? (
                                        <div style={{ padding: "8px 12px", borderRadius: 8, background: "#ECFDF5", border: "1px solid #A7F3D0", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "#047857", fontWeight: 600, fontSize: 13, gridColumn: "1 / -1", letterSpacing: "-0.1px" }}><CheckCircleFilled /><span>Shift Complete!</span></div>
                                      ) : (
                                        <>
                                          {isWorking
                                            ? <Button block icon={<PauseCircleOutlined />} onClick={() => setBreakModalOpen(true)} loading={isClocking} style={{ borderRadius: 8, height: 36, fontWeight: 600, fontSize: 13, color: "#B45309", borderColor: "#FDE047", background: "#FEF9C3", boxShadow: "none", letterSpacing: "-0.1px" }}>Pause</Button>
                                            : <Button type="primary" block icon={<CaretRightOutlined />} onClick={handleResume} loading={isClocking} style={{ borderRadius: 8, height: 36, fontWeight: 600, fontSize: 13, background: token.colorPrimary, border: "none", boxShadow: "none", letterSpacing: "-0.1px" }}>Resume</Button>
                                          }
                                          <div style={{ display: "contents" }}><ConfirmDialog tone="warning" icon={<CheckSquareOutlined />} title="Complete your day?" description={`You've worked ${workDuration}. You won't be able to clock in again today.`} confirmText="Yes, complete day" placement="topRight" onConfirm={handleComplete}>
                                            <Button block icon={<CheckSquareOutlined />} loading={isClocking} style={{ borderRadius: 8, height: 36, fontWeight: 600, fontSize: 13, color: "#047857", borderColor: "#6EE7B7", background: "#ECFDF5", boxShadow: "none", letterSpacing: "-0.1px" }}>Day Complete</Button>
                                          </ConfirmDialog></div>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                );
                              })() : (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                                  <Skeleton.Avatar active size={100} shape="circle" />
                                  <Skeleton active paragraph={{ rows: 2 }} style={{ width: "100%" }} />
                                  <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleClockIn} loading={isClocking} style={{ borderRadius: 8, height: 40, fontWeight: 600, fontSize: 13, boxShadow: "none", border: "none", width: "100%", flexShrink: 0 }}>Clock In</Button>
                                </div>
                              )}
                            </Card>
                          </Col>
                        )}

                        {/* My Work Progress */}
                        {isMyTicketsVisible && (
                          <Col xs={24} md={12} lg={7}>
                            {(() => {
                              const segments = [
                                { key: "done", label: "Completed", value: completedTickets, color: "#3B82F6", icon: <CheckCircleFilled style={{ fontSize: 10 }} /> },
                                { key: "active", label: "In Progress", value: inProgressTickets, color: "#10B981", icon: <SyncOutlined spin style={{ fontSize: 10 }} /> },
                                { key: "not_started", label: "Pending", value: notStartedTickets, color: token.colorTextTertiary, icon: <ClockCircleOutlined style={{ fontSize: 10 }} /> },
                              ];
                              return (
                                <Card
                                  style={{ ...cardBase, height: 250, overflow: "hidden", display: "flex", flexDirection: "column" }}
                                  styles={{ body: { padding: 0, height: "100%", display: "flex", flexDirection: "column" } }}
                                  title={sectionTitle(<FileTextOutlined />, "My Work Progress", "#3B82F6")}
                                  extra={
                                    <Select
                                      size="small"
                                      placeholder="Select Project"
                                      allowClear={false}
                                      variant="filled"
                                      dropdownStyle={{ borderRadius: 8, padding: 4 }}
                                      style={{
                                        width: 140,
                                        fontWeight: 600,
                                      }}
                                      value={selectedProjectId}
                                      onChange={(val) => setSelectedProjectId(val)}
                                      options={userProjects.map((p: any) => ({
                                        label: (
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                                            <FolderOpenOutlined style={{ color: '#3B82F6' }} />
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                                          </div>
                                        ),
                                        value: p.id || p._id,
                                      }))}
                                    />
                                  }
                                >
                                  <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "12px 16px" }}>
                                    {/* Main section: Circle + Segments */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 12 }}>
                                      {/* Left: Progress Circle */}
                                      <Progress
                                        type="circle"
                                        percent={completionRate}
                                        size={76}
                                        strokeWidth={10}
                                        strokeLinecap="round"
                                        strokeColor="#3B82F6"
                                        trailColor={token.colorFillAlter}
                                        format={() => (
                                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", lineHeight: 1, paddingTop: 2 }}>
                                            <span style={{ fontSize: 16, fontWeight: 800, color: "#3B82F6", marginBottom: 2, letterSpacing: "-0.5px" }}>{completionRate}%</span>
                                            <span style={{ fontSize: 9, fontWeight: 700, color: token.colorTextTertiary }}>Completed</span>
                                          </div>
                                        )}
                                      />

                                      {/* Right: Segments List */}
                                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                                        {segments.map((s) => (
                                          <div key={s.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                                              <Text style={{ fontSize: 11, fontWeight: 600, color: token.colorTextSecondary, letterSpacing: "-0.2px" }}>{s.label}</Text>
                                            </div>
                                            <Text strong style={{ fontSize: 13, color: token.colorText, fontVariantNumeric: "tabular-nums" }}>{s.value}</Text>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Divider */}
                                    <div style={{ height: 1, background: token.colorBorderSecondary, margin: "4px 0 12px" }} />

                                    {/* Totals Footer */}
                                    <div style={{ display: "flex", gap: 32 }}>
                                      <div>
                                        <Text style={{ fontSize: 9, color: token.colorTextTertiary, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 2 }}>TOTAL TICKETS</Text>
                                        <Text strong style={{ fontSize: 18, color: token.colorText, fontVariantNumeric: "tabular-nums", lineHeight: 1, letterSpacing: "-0.5px" }}>{totalTickets}</Text>
                                      </div>
                                      <div>
                                        <Text style={{ fontSize: 9, color: token.colorTextTertiary, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 2 }}>CLOSED TODAY</Text>
                                        <Text strong style={{ fontSize: 18, color: "#10B981", fontVariantNumeric: "tabular-nums", lineHeight: 1, letterSpacing: "-0.5px" }}>{completedTickets}</Text>
                                      </div>
                                    </div>
                                  </div>
                                </Card>
                              );
                            })()}
                          </Col>
                        )}

                        {/* Recent Tickets */}
                        {isRecentTicketsVisible && (
                          <Col xs={24} md={24} lg={10}>
                            {(() => {
                              const accent = "#3B82F6";
                              return (
                                <Card
                                  style={{ ...cardBase, height: 250, display: "flex", flexDirection: "column", overflow: "hidden" }}
                                  styles={{ body: { padding: 0, display: "flex", flexDirection: "column", flex: 1, minHeight: 0 } }}
                                  title={sectionTitle(<FileTextOutlined />, "Recent Tickets", accent)}
                                  extra={<Button type="link" size="small" onClick={() => router.push("/tickets/select")} style={{ fontSize: 11, fontWeight: 600 }}>View all <ArrowRightOutlined style={{ fontSize: 10 }} /></Button>}
                                >
                                  {recentTickets.length === 0 ? (
                                    <div style={{ padding: 24, textAlign: "center", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
                                      <div style={{ width: 52, height: 52, borderRadius: 16, background: `${accent}14`, border: `1px solid ${accent}33`, display: "inline-flex", alignItems: "center", justifyContent: "center", color: accent, fontSize: 22 }}><FileTextOutlined /></div>
                                      <Text strong style={{ fontSize: 13, color: token.colorText }}>No tickets yet</Text>
                                      <Text type="secondary" style={{ fontSize: 11 }}>Recent assignments will appear here</Text>
                                    </div>
                                  ) : (
                                    <div className="no-scrollbar" style={{ display: "flex", flexDirection: "column", flex: 1, overflowY: "auto" }}>
                                      {recentTickets.map((item: any) => {
                                        const status = item.status?.toLowerCase();
                                        const statusMeta: Record<string, { label: string; color: string; bg: string }> = {
                                          completed: { label: "Completed", color: "#10B981", bg: "#ECFDF5" },
                                          live: { label: "Live", color: "#10B981", bg: "#ECFDF5" },
                                          done: { label: "Done", color: "#10B981", bg: "#ECFDF5" },
                                          in_progress: { label: "In Progress", color: "#3B82F6", bg: "#EFF6FF" },
                                          doing: { label: "In Progress", color: "#3B82F6", bg: "#EFF6FF" },
                                          in_testing: { label: "In Testing", color: "#8B5CF6", bg: "#F5F3FF" },
                                          testing: { label: "In Testing", color: "#8B5CF6", bg: "#F5F3FF" },
                                          not_started: { label: "Open", color: "#94A3B8", bg: token.colorFillAlter },
                                        };
                                        const sm = statusMeta[status] || { label: (item.status || "—").replace(/_/g, " "), color: token.colorTextSecondary, bg: token.colorFillAlter };
                                        const projectLabel = typeof item.project === "string" ? item.project : item.project?.code || item.project?.name || "—";
                                        return (
                                          <div
                                            key={item.id}
                                            onClick={() => setSelectedTicketId(item.id)}
                                            className="dash-rt-card"
                                            style={{ cursor: "pointer", padding: "8px 12px", borderBottom: `1px solid ${token.colorBorderSecondary}`, display: "flex", alignItems: "center", gap: 12, ["--rt-glow" as any]: `${sm.color}55`, ["--rt-border" as any]: `${sm.color}55` } as React.CSSProperties}
                                          >
                                            {/* Status badge */}
                                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, color: sm.color, background: sm.bg, padding: "3px 8px", borderRadius: 999, border: `1px solid ${sm.color}26`, flexShrink: 0, whiteSpace: "nowrap" }}>
                                              <span style={{ width: 5, height: 5, borderRadius: "50%", background: sm.color, display: "inline-block" }} />{sm.label}
                                            </span>
                                            {/* Ticket info */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                              <Text style={{ fontSize: 12, fontWeight: 600, color: token.colorText, display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</Text>
                                              <Text type="secondary" style={{ fontSize: 10 }}>{item.ticketNumber}{projectLabel && projectLabel !== "—" ? ` · ${projectLabel}` : ""}</Text>
                                            </div>
                                            {/* Time ago */}
                                            <Text style={{ fontSize: 10, color: token.colorTextTertiary, whiteSpace: "nowrap", flexShrink: 0 }}>{formatTimeAgo(item.createdAt)}</Text>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </Card>
                              );
                            })()}
                          </Col>
                        )}

                      </Row>
                    </>
                  );
                })()}

              </>
            ) : null}
          </>
        )}


        {/* ─── FREELANCER SEGMENT ─────────────────────────────── */}
        {activeSegment === "freelancer" && (
          <>
            {loading ? (
              <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
                {[1, 2, 3, 4].map((i) => (
                  <Col xs={24} sm={12} lg={6} key={i}>
                    <Card size="small" style={{ ...cardBase }} styles={{ body: { padding: 14 } }}>
                      <Skeleton active paragraph={{ rows: 1 }} />
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <>
                {/* ─── KPI Strip ──────────────────────────────────── */}
                <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
                  {isMyTicketsVisible && (
                    <Col xs={24} sm={12} lg={6}>
                      {(() => {
                        const closed = myTicketsStats.closed;
                        const totalT = myTicketsStats.total;
                        const open = Math.max(0, totalT - closed);
                        const pctDone = totalT > 0 ? Math.round((closed / totalT) * 100) : 0;
                        const accent = "#3B82F6";
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
                                        background: "#93C5FD",
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
                                          background: "#93C5FD",
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
                  )}
                  {isRecentLeadsVisible && (
                    <Col xs={24} sm={12} lg={6}>
                      {(() => {
                        const accent = "#10B981";
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
                                        background: accent,
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
                  )}
                  {isFreelancerStatsVisible && (
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
                  )}
                  {isFreelancerStatsVisible && (
                    <Col xs={24} sm={12} lg={6}>
                      {(() => {
                        const active = dashboardData?.stats.activeProjects || 0;
                        const growth = dashboardData?.trends.projectGrowth || "0%";
                        const accent = "#3B82F6";
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
                                        background: accent,
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
                  )}
                </Row>

                {/* ─── Main Grid ──────────────────────────────────── */}
                <Row gutter={[12, 12]}>
                  {/* My Tickets Stats */}
                  {isMyTicketsVisible && (
                    <Col xs={24} lg={8}>
                      {(() => {
                        const segments = [
                          { key: "done", label: "Done", value: completedTickets, color: "#10B981", icon: <CheckCircleFilled style={{ fontSize: 11 }} /> },
                          { key: "active", label: "Active", value: inProgressTickets, color: "#3B82F6", icon: <SyncOutlined spin style={{ fontSize: 11 }} /> },
                          { key: "testing", label: "In Testing", value: inTestingTickets, color: "#10B981", icon: <ExperimentOutlined style={{ fontSize: 11 }} /> },
                          { key: "not_started", label: "Not Started", value: notStartedTickets, color: "#94A3B8", icon: <ClockCircleOutlined style={{ fontSize: 11 }} /> },
                        ];
                        const pct = (n: number) => totalTickets > 0 ? Math.round((n / totalTickets) * 100) : 0;
                        return (
                          <Card
                            style={{ ...cardBase, minHeight: 330, height: "100%", overflow: "hidden" }}
                            styles={{ body: { padding: 0, height: "100%", display: "flex", flexDirection: "column" } }}
                            title={sectionTitle(<TrophyOutlined />, "My Tickets", "#3B82F6")}
                            extra={<Button type="link" size="small" onClick={() => router.push("/tickets/select")} style={{ fontSize: 11 }}>View all</Button>}
                          >
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "8px 12px 10px" }}>
                              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10, marginBottom: 4 }}>
                                <div>
                                  <Text style={{ fontSize: 10, fontWeight: 700, color: token.colorTextSecondary, letterSpacing: "0.6px", textTransform: "uppercase", display: "block" }}>Completion</Text>
                                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 0 }}>
                                    <span style={{ fontSize: 20, fontWeight: 700, lineHeight: 1, color: token.colorPrimary, letterSpacing: "-0.5px", fontVariantNumeric: "tabular-nums" }}>
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
                  )}

                  {/* Today's Meetings */}
                  {isCalendarVisible && (
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
                                  minWidth: 0,
                                }}
                              >
                                <div
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 8,
                                    background: `${accentTM}14`,
                                    border: `1px solid ${accentTM}33`,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: accentTM,
                                    fontSize: 13,
                                    flexShrink: 0,
                                  }}
                                >
                                  <VideoCameraOutlined />
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                                  <span
                                    style={{
                                      fontSize: 14,
                                      fontWeight: 600,
                                      color: token.colorText,
                                      letterSpacing: "-0.1px",
                                      lineHeight: 1.2,
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                  >
                                    Today's Meetings
                                  </span>
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
                                        width: "fit-content",
                                        lineHeight: 1.2,
                                      }}
                                    >
                                      {tmCount} TODAY
                                    </span>
                                  )}
                                </div>
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
                                        padding: "12px 14px 14px",
                                      }}
                                    >
                                      {/* Sub-header status bar */}
                                      <div
                                        style={{
                                          display: "flex",
                                          justifyContent: "space-between",
                                          alignItems: "center",
                                          background: "var(--bg-slate-50)",
                                          border: "1px solid var(--border-color)",
                                          borderRadius: 8,
                                          padding: "6px 12px",
                                          marginBottom: 2,
                                        }}
                                      >
                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                          {liveTM ? (
                                            <span
                                              style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: 6,
                                                fontSize: 11,
                                                fontWeight: 700,
                                                color: "#047857",
                                              }}
                                            >
                                              <span
                                                style={{
                                                  width: 6,
                                                  height: 6,
                                                  borderRadius: "50%",
                                                  background: "#10B981",
                                                  boxShadow: "0 0 0 2px rgba(16, 185, 129, 0.2)",
                                                  animation: "pulse-soft 2s infinite ease-in-out",
                                                }}
                                              />
                                              Live now
                                            </span>
                                          ) : upcomingTM > 0 ? (
                                            <span
                                              style={{
                                                fontSize: 11,
                                                fontWeight: 700,
                                                color: "#4F46E5",
                                              }}
                                            >
                                              {upcomingTM} upcoming
                                            </span>
                                          ) : (
                                            <span style={{ fontSize: 11, color: token.colorTextTertiary, fontStyle: "italic", fontWeight: 600 }}>
                                              No more meetings
                                            </span>
                                          )}
                                        </div>
                                        {ended.length > 0 && (
                                          <Text
                                            style={{
                                              fontSize: 10.5,
                                              color: token.colorTextTertiary,
                                              fontWeight: 600,
                                              textTransform: "uppercase",
                                              letterSpacing: "0.2px",
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
                                                borderRadius: 16,
                                                padding: 16,
                                                background: live ? "linear-gradient(135deg, #10B981 0%, #059669 100%)" : "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
                                                boxShadow: live ? "0 10px 25px -5px rgba(16, 185, 129, 0.4)" : "0 10px 25px -5px rgba(59, 130, 246, 0.4)",
                                                border: "none",
                                                overflow: "hidden",
                                                color: "#fff",
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
                                                      fontSize: 16,
                                                      fontWeight: 800,
                                                      color: "#fff",
                                                      letterSpacing: "-0.3px",
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
                                                    gap: 6,
                                                    padding: "4px 10px",
                                                    borderRadius: 999,
                                                    background: "rgba(255, 255, 255, 0.2)",
                                                    border: "1px solid rgba(255, 255, 255, 0.3)",
                                                    color: "#fff",
                                                    fontSize: 10,
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
                                                      width: 6,
                                                      height: 6,
                                                      borderRadius: "50%",
                                                      background: "#fff",
                                                    }}
                                                  />
                                                  {live ? "LIVE NOW" : "NEXT UP"}
                                                </span>
                                              </div>
                                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                                <Text
                                                  style={{
                                                    fontSize: 12,
                                                    color: "rgba(255, 255, 255, 0.9)",
                                                    fontVariantNumeric: "tabular-nums",
                                                    fontWeight: 600,
                                                  }}
                                                >
                                                  {start.format("h:mm A")} — {end.format("h:mm A")}
                                                </Text>
                                                <span style={{ color: "rgba(255, 255, 255, 0.5)" }}>•</span>
                                                <Text
                                                  style={{
                                                    fontSize: 12,
                                                    color: "rgba(255, 255, 255, 0.9)",
                                                    fontWeight: 600,
                                                  }}
                                                >
                                                  {formatRelative(heroMeeting)}
                                                </Text>
                                              </div>

                                              {live && (
                                                <div
                                                  style={{
                                                    marginTop: 12,
                                                    height: 6,
                                                    background: "rgba(255, 255, 255, 0.2)",
                                                    borderRadius: 999,
                                                    overflow: "hidden",
                                                  }}
                                                >
                                                  <div
                                                    style={{
                                                      height: "100%",
                                                      width: `${progressPct}%`,
                                                      background: "#fff",
                                                      borderRadius: 999,
                                                      transition: "width 1s linear",
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
                                                  block
                                                  size="middle"
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
                                                    marginTop: 14,
                                                    borderRadius: 10,
                                                    background: "#fff",
                                                    color: live ? "#059669" : "#2563EB",
                                                    border: "none",
                                                    fontWeight: 700,
                                                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
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
                                                    gap: 12,
                                                    padding: "10px 12px",
                                                    borderRadius: 12,
                                                    background: past ? "transparent" : "#f8fafc",
                                                    border: past ? "1px dashed #e2e8f0" : "1px solid #e2e8f0",
                                                    opacity: past ? 0.6 : 1,
                                                    transition: "all 0.2s ease",
                                                  }}
                                                >
                                                  <div
                                                    style={{
                                                      minWidth: 48,
                                                      textAlign: "center",
                                                      padding: "6px 0",
                                                      borderRadius: 10,
                                                      background: past ? "#f1f5f9" : "#fff",
                                                      border: past ? "none" : "1px solid #cbd5e1",
                                                      boxShadow: past ? "none" : "0 2px 4px rgba(0,0,0,0.02)"
                                                    }}
                                                  >
                                                    <div
                                                      style={{
                                                        fontSize: 12,
                                                        fontWeight: 800,
                                                        color: past ? "#94a3b8" : "#0f172a",
                                                        fontVariantNumeric: "tabular-nums",
                                                        lineHeight: 1,
                                                      }}
                                                    >
                                                      {start.format("h:mm")}
                                                    </div>
                                                    <div
                                                      style={{
                                                        fontSize: 9,
                                                        fontWeight: 700,
                                                        color: past ? "#94a3b8" : "#64748b",
                                                        letterSpacing: "0.5px",
                                                        marginTop: 2,
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
                                                          fontSize: 13,
                                                          fontWeight: 600,
                                                          color: past ? "#64748b" : "#0f172a",
                                                          whiteSpace: "nowrap",
                                                          overflow: "hidden",
                                                          textOverflow: "ellipsis",
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
                                      background: "#EFF6FF",
                                      border: "1px solid #BFDBFE",
                                      margin: "0 auto 10px",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      color: "#3B82F6",
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
                  )}

                  {/* Recent Tickets List */}
                  {isRecentTicketsVisible && (
                    <Col xs={24} lg={8}>
                      {(() => {
                        const accent = "#3B82F6";
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
                              height: 300,
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
                                onClick={() => router.push("/tickets/select")}
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
                                        color: "#3B82F6",
                                        bg: "#EFF6FF",
                                      },
                                      doing: {
                                        label: "In Progress",
                                        color: "#3B82F6",
                                        bg: "#EFF6FF",
                                      },
                                      in_testing: {
                                        label: "In Testing",
                                        color: "#10B981",
                                        bg: "#ECFDF5",
                                      },
                                      testing: {
                                        label: "In Testing",
                                        color: "#10B981",
                                        bg: "#ECFDF5",
                                      },
                                      live_testing: {
                                        label: "In Testing",
                                        color: "#10B981",
                                        bg: "#ECFDF5",
                                      },
                                      "live testing": {
                                        label: "In Testing",
                                        color: "#10B981",
                                        bg: "#ECFDF5",
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
                                                boxShadow: "none",
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
                                                    backgroundColor: "#3B82F6",
                                                    fontSize: 9,
                                                    fontWeight: 700,
                                                    border: `2px solid ${token.colorBgContainer}`,
                                                    boxShadow: "none",
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
                  )}

                  {/* Recent Leads */}
                  {isRecentLeadsVisible && (
                    <Col xs={24} lg={12}>
                      {(() => {
                        const accent = "#10B981";
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
                          open: { label: "Open", color: "#10B981", bg: "#ECFDF5" },
                          new: { label: "New", color: "#10B981", bg: "#ECFDF5" },
                          qualified: {
                            label: "Qualified",
                            color: "#3B82F6",
                            bg: "#EFF6FF",
                          },
                          contacted: {
                            label: "Contacted",
                            color: "#3B82F6",
                            bg: "#EFF6FF",
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
                              height: 300,
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
                                          boxShadow: "none",
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
                                        background: "#FEF2F2",
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
                                                boxShadow: "none",
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
                                                      : "#3B82F6",
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
                                                    color: "#10B981",
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
                  )}

                  {/* Created Invoices */}
                  {isRecentInvoicesVisible && (
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
                            color: "#10B981",
                            bg: "#ECFDF5",
                          },
                          OVERDUE: {
                            label: "Overdue",
                            color: "#EF4444",
                            bg: "#FEF2F2",
                          },
                          SENT: { label: "Sent", color: "#3B82F6", bg: "#EFF6FF" },
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
                              height: 300,
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
                                          boxShadow: "none",
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
                                        ? "#10B981"
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
                                                boxShadow: "none",
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
                                      router.push("/invoice/newinvoice")
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
                  )}
                </Row>
              </>
            )}
          </>
        )}

        {/* ─── ORGANIZATION SEGMENT ─────────────────────────────── */}
        {activeSegment === "organization" && <Organization dashboardSettings={dashboardSettings} />}

        <TicketDetailDrawer
          ticketId={selectedTicketId}
          open={!!selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
          ticketIds={recentTickets.map((t: any) => t.id)}
          onNavigate={(id) => setSelectedTicketId(id)}
        />
        <ManualCreateTicketModal
          open={isCreateTicketModalOpen}
          onClose={() => setIsCreateTicketModalOpen(false)}
          projectId=""
        />
      </div>

    </MainLayout>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<ZukvoLoader message="Loading dashboard..." />}>
      <DashboardContent />
    </Suspense>
  );
}