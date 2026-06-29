
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Space,
  Spin,
  Tag,
  Button,
  Table,
  Avatar,
  Statistic,
  Progress,
  Divider,
  Tabs,
  Tooltip,
  Drawer,
  Descriptions,
} from "antd";

import {
  UserOutlined,
  FilterOutlined,
  TagOutlined,
  FileTextOutlined,
  TeamOutlined,
  BankOutlined,
  FlagOutlined,
  StarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  HistoryOutlined,
  WarningOutlined,
  CloseSquareOutlined,
  SafetyCertificateOutlined,
  AlertOutlined,
  ProjectOutlined,
  UserOutlined as AntUserOutlined,
  AreaChartOutlined,
  RightOutlined,
} from "@ant-design/icons";
import MainLayout from "@/components/layout/MainLayout";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import { MembersService } from "@/services/membersService";
import {
  AttendanceService,
  AttendanceSummary,
} from "@/services/attendanceService";
import { usePerformance } from "@/hooks/userPerformance";
import { usePositions } from "@/hooks/usePositions";
import { useTheme } from "@/context/ThemeContext";
import { useQuery } from "@tanstack/react-query";
import { EscalationServiceV2 } from "@/services/escalationServiceV2";
import {
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import {
  Activity,
  Filter,
  Search,
  User,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  Award,
  Zap,
  AlertTriangle
} from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Text, Title } = Typography;

const StatCard = ({ label, value, icon: Icon, color, suffix }: any) => (
  <Card
    styles={{ body: { padding: "16px 20px" } }}
    style={{
      borderRadius: 12,
      border: "1px solid var(--border-color)",
      boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      height: "100%",
      background: 'var(--bg-pure-white)'
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <Text style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 500 }}>{label}</Text>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 4 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>{value}</div>
          {suffix && <Text type="secondary" style={{ fontSize: 14 }}>{suffix}</Text>}
        </div>
      </div>
      <div style={{ color: color, background: `${color}15`, padding: 10, borderRadius: 12, display: "flex" }}>
        <Icon size={20} />
      </div>
    </div>
  </Card>
);

export default function PerformanceManagePage() {
  const [loading, setLoading] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>();
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [loadingPercent, setLoadingPercent] = useState<number>(0);

  // State for selected user's full details including position
  const [selectedUserDetails, setSelectedUserDetails] = useState<any>(null);
  const [breakdownVisible, setBreakdownVisible] = useState(false);
  const [dailyBreakdownVisible, setDailyBreakdownVisible] = useState(false);
  const [escalationBreakdownVisible, setEscalationBreakdownVisible] = useState(false);

  // Active section for the left-rail navigation (Proposals-style)
  const [activeSection, setActiveSection] = useState<string>("overview");

  // Get all positions data
  const { dataSource: positions, loading: positionsLoading } = usePositions();

  // Attendance summary state
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary>(
    {
      totalDays: 0,
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      halfDays: 0,
      totalWorkingMinutes: 0,
      totalOvertimeMinutes: 0,
      averageWorkingHours: 0,
    },
  );

  // Filters for API
  const [appliedFilters, setAppliedFilters] = useState<{
    userId?: string;
    month?: string;
    year?: string;
  }>({});

  const [showAllProjects, setShowAllProjects] = useState(false);

  // Check if selected month is in the future
  const isFutureMonth = useMemo(() => {
    const today = dayjs();
    const selectedDate = dayjs(`${selectedYear}-${selectedMonth}-01`);
    return selectedDate.isAfter(today, "month");
  }, [selectedYear, selectedMonth]);

  // Use the performance hook
  const { data: performanceData, isLoading: performanceLoading } =
    usePerformance(appliedFilters);

  const [selectedEscalationId, setSelectedEscalationId] = useState<string | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Fetch full escalation details when one is selected
  const { data: fullEscalation, isLoading: loadingDetails } = useQuery({
    queryKey: ['escalation', selectedEscalationId],
    queryFn: () => selectedEscalationId ? EscalationServiceV2.getEscalationById(selectedEscalationId) : null,
    enabled: !!selectedEscalationId,
  });

  const handleRowClick = (record: any) => {
    setSelectedEscalationId(record.id);
    setDrawerVisible(true);
  };

  // Fetch members on page load
  useEffect(() => {
    fetchMembers();
  }, []);

  // Fetch attendance data when filters are applied (only if not future month)
  useEffect(() => {
    if (
      appliedFilters.userId &&
      appliedFilters.month &&
      appliedFilters.year &&
      !isFutureMonth
    ) {
      fetchAttendanceSummary();
    } else if (isFutureMonth) {
      // Reset attendance summary for future months
      setAttendanceSummary({
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        lateDays: 0,
        halfDays: 0,
        totalWorkingMinutes: 0,
        totalOvertimeMinutes: 0,
        averageWorkingHours: 0,
      });
    }
  }, [appliedFilters, isFutureMonth]);

  useEffect(() => {
    setIsGenerating(false);
  }, [selectedMember]);

  useEffect(() => {
    let interval: any;
    if (isGenerating && (performanceLoading || attendanceLoading)) {
      interval = setInterval(() => {
        setLoadingPercent((prev) => {
          if (prev >= 98) return prev;
          const increment = Math.random() * 15;
          return Math.min(prev + increment, 98);
        });
      }, 400);
    } else if (isGenerating && !performanceLoading && !attendanceLoading) {
      setLoadingPercent(100);
    }
    return () => clearInterval(interval);
  }, [performanceLoading, attendanceLoading, isGenerating]);

  // Fetch selected user details when member is selected
  useEffect(() => {
    if (selectedMember && members.length > 0) {
      const member = members.find((m) => m.value === selectedMember);
      setSelectedUserDetails(member || null);
    } else {
      setSelectedUserDetails(null);
    }
  }, [selectedMember, members]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const membersData = await MembersService.getMembersForSelect();

      // Enhance members data with position info if available
      // You may need to fetch additional details here
      setMembers(membersData || []);
    } catch (error) {
      console.error("Failed to fetch members:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate working days (excluding weekends) in a month
  const getWorkingDaysCount = (year: number, month: number) => {
    const startOfMonth = dayjs()
      .year(year)
      .month(month - 1)
      .startOf("month");
    const endOfMonth = dayjs()
      .year(year)
      .month(month - 1)
      .endOf("month");

    let workingDays = 0;
    let currentDay = startOfMonth;

    while (currentDay.isBefore(endOfMonth) || currentDay.isSame(endOfMonth, "day")) {
      const dayOfWeek = currentDay.day();
      // 0 = Sunday, 6 = Saturday
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++;
      }
      currentDay = currentDay.add(1, "day");
    }

    return workingDays;
  };

  // Fetch attendance summary from API
  const fetchAttendanceSummary = async () => {
    if (!appliedFilters.userId || !appliedFilters.month || !appliedFilters.year) {
      setAttendanceLoading(false);
      return;
    }

    try {
      setAttendanceLoading(true);

      const selectedYearNum = parseInt(appliedFilters.year);
      const selectedMonthNum = parseInt(appliedFilters.month);

      // Calculate start and end dates for the selected month
      const startDate = dayjs()
        .year(selectedYearNum)
        .month(selectedMonthNum - 1)
        .startOf("month")
        .format("YYYY-MM-DD");

      const endDate = dayjs()
        .year(selectedYearNum)
        .month(selectedMonthNum - 1)
        .endOf("month")
        .format("YYYY-MM-DD");

      console.log("📅 Fetching attendance for:", {
        userId: appliedFilters.userId,
        month: selectedMonthNum,
        year: selectedYearNum,
        startDate,
        endDate,
      });

      // Fetch all attendance records for this user in the date range
      const response = await AttendanceService.getAttendance({
        userId: appliedFilters.userId,
        startDate,
        endDate,
        limit: 1000,
      });

      console.log("📊 Attendance API Response:", response);

      const attendanceRecords = response?.data || [];

      // Calculate summary from attendance records
      // EXCLUDE WEEKENDS as per user request
      const workingDaysCount = getWorkingDaysCount(selectedYearNum, selectedMonthNum);
      const totalDays = workingDaysCount; // Use working days instead of calendar days

      const presentDays = attendanceRecords.filter(
        (r: any) =>
          r.status === "present" ||
          r.status === "late" ||
          r.status === "half-day",
      ).length;

      const absentDays = attendanceRecords.filter(
        (r: any) => r.status === "absent",
      ).length;

      const lateDays = attendanceRecords.filter(
        (r: any) => r.status === "late",
      ).length;

      const halfDays = attendanceRecords.filter(
        (r: any) => r.status === "half-day",
      ).length;

      // Calculate working minutes
      const totalWorkingMinutes = attendanceRecords.reduce(
        (sum: number, r: any) => sum + (r.workingMinutes || 0),
        0,
      );

      const totalOvertimeMinutes = attendanceRecords.reduce(
        (sum: number, r: any) => sum + (r.overtimeMinutes || 0),
        0,
      );

      const averageWorkingHours =
        presentDays > 0 ? totalWorkingMinutes / presentDays / 60 : 0;

      const summary = {
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        halfDays,
        totalWorkingMinutes,
        totalOvertimeMinutes,
        averageWorkingHours: Math.round(averageWorkingHours * 10) / 10,
      };

      console.log("📊 Calculated Attendance Summary:", summary);
      setAttendanceSummary(summary);
    } catch (error) {
      console.error("Failed to fetch attendance summary:", error);
      setAttendanceSummary({
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        lateDays: 0,
        halfDays: 0,
        totalWorkingMinutes: 0,
        totalOvertimeMinutes: 0,
        averageWorkingHours: 0,
      });
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Apply filters
  const handleApply = () => {
    setAppliedFilters({
      userId: selectedMember,
      month: selectedMonth,
      year: selectedYear.toString(),
    });
    setIsGenerating(true);
    setLoadingPercent(0);
  };

  // Month options
  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const years = ["2024", "2025", "2026"];

  // Ticket data from API
  const ticketSummary = performanceData?.tickets?.summary || {
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    onTime: 0,
    late: 0,
    untracked: 0,
  };

  const ticketDistribution = performanceData?.tickets?.distribution || [];

  const projectStats = useMemo(() => {
    const stats: { [key: string]: number } = {};
    performanceData?.tickets?.details?.forEach((t: any) => {
      const name = t.projectName || "No Project";
      stats[name] = (stats[name] || 0) + 1;
    });
    return stats;
  }, [performanceData?.tickets?.details]);

  const assignedProjects = performanceData?.assignedProjects || [];

  // Daily Updates data from API
  const dailyUpdatesSummary = performanceData?.dailyUpdates?.summary || {
    bod: 0,
    eod: 0,
    total: 0,
  };

  // Get the updates that exist
  const existingUpdates = performanceData?.dailyUpdates?.logs || [];

  // Table columns for Daily Updates
  const dailyUpdateColumns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 100,
      render: (text: string) => dayjs(text).format("DD MMM"),
    },
    {
      title: "BOD",
      dataIndex: "bod",
      key: "bod",
      width: 60,
      align: "center" as const,
      render: (bod: boolean) => (bod ? "✅" : "❌"),
    },
    {
      title: "EOD",
      dataIndex: "eod",
      key: "eod",
      width: 60,
      align: "center" as const,
      render: (eod: boolean) => (eod ? "✅" : "❌"),
    },
    {
      title: "Status",
      dataIndex: "type",
      key: "type",
      width: 90,
      render: (type: string, record: any) => {
        if (record.bod && record.eod) return "Complete";
        if (record.bod) return "BOD Only";
        if (record.eod) return "EOD Only";
        return "Missed";
      },
    },
  ];

  // Calculate days in month based on applied filters
  const appliedMonth = appliedFilters.month || selectedMonth;
  const appliedYear = appliedFilters.year || selectedYear;
  const daysInMonth = dayjs(`${appliedYear}-${appliedMonth}-01`).daysInMonth();

  // Calculate summary statistics
  // Performance Metrics from Hook
  const perf = performanceData?.performance || {
    score: 0,
    ticketScore: 0,
    eodPenalty: 0,
    escalationPenalty: 0,
    completionScore: 0,
    timelinessScore: 0,
    trackingScore: 0
  };

  const performanceScore = perf.score;
  const ticketScore = perf.ticketScore;
  const eodPenalty = perf.eodPenalty;
  const escalationPenalty = perf.escalationPenalty;

  // Keep rates for separate displays if needed, but derived from new logic
  const completionRate = perf.completionScore;

  const updateRate =
    dailyUpdatesSummary.total > 0
      ? Math.round(((dailyUpdatesSummary.bod + dailyUpdatesSummary.eod) / (2 * dailyUpdatesSummary.total)) * 100)
      : 0;

  // Calculate attendance rate (only if not future month and has data)
  const attendanceRate =
    !isFutureMonth && attendanceSummary.totalDays > 0
      ? Math.round(
        (attendanceSummary.presentDays / attendanceSummary.totalDays) * 100,
      )
      : 0;

  // BOD and EOD out of format
  const bodOutOf = `${dailyUpdatesSummary.bod}/${attendanceSummary.totalDays}`;
  const eodOutOf = `${dailyUpdatesSummary.eod}/${attendanceSummary.totalDays}`;

  // Attendance out of format
  const presentOutOf = `${attendanceSummary.presentDays}/${attendanceSummary.totalDays}`;
  const lateOutOf = `${attendanceSummary.lateDays}/${attendanceSummary.totalDays}`;
  const absentOutOf = `${attendanceSummary.absentDays}/${attendanceSummary.totalDays}`;

  // Get position tags for selected user
  const positionTags = useMemo(() => {
    if (!selectedUserDetails || !positions.length) return [];

    const tags = [];

    // Try to find matching position based on user's role/department
    // This logic needs to be adjusted based on your actual data structure

    // For now, we'll show some sample tags if position data exists
    if (positions.length > 0) {
      // You need to map user to position based on your data structure
      // Example: If user has positionId in their details
      // const userPosition = positions.find(p => p.id === selectedUserDetails.positionId);

      // For demo, showing first position from list
      const samplePosition = positions[0];

      if (samplePosition) {
        if (samplePosition.title) {
          tags.push({
            icon: <FlagOutlined />,
            color: "cyan",
            label: samplePosition.title,
          });
        }

        if (samplePosition.gradeName) {
          tags.push({
            icon: <StarOutlined />,
            color: "green",
            label: `Grade: ${samplePosition.gradeName}`,
          });
        }

        if (samplePosition.departmentName) {
          tags.push({
            icon: <BankOutlined />,
            color: "purple",
            label: samplePosition.departmentName,
          });
        }

        if (samplePosition.subDepartmentName) {
          tags.push({
            icon: <TeamOutlined />,
            color: "orange",
            label: samplePosition.subDepartmentName,
          });
        }
      }
    }

    return tags;
  }, [selectedUserDetails, positions]);
  console.log("🔍 selectedUserDetails:", selectedUserDetails);
  useEffect(() => {
    console.log("🔍 Debug: selectedMember", selectedMember);
    console.log("🔍 Debug: appliedFilters", appliedFilters);
    console.log("🔍 Debug: isFutureMonth", isFutureMonth);
    console.log("🔍 Debug: attendanceSummary", attendanceSummary);
    console.log("🔍 Debug: performanceData", performanceData);
    console.log("🔍 Debug: positions", positions);
    console.log("🔍 Debug: selectedUserDetails", selectedUserDetails);
    console.log("🔍 Debug: positionTags", positionTags);

    if (positions.length > 0) {
      console.log("🔍 Debug: positions - DETAILS:");
      positions.forEach((pos, index) => {
        console.log(`Position ${index + 1}:`, {
          id: pos.id,
          title: pos.title,
          gradeName: pos.gradeName,
          departmentName: pos.departmentName,
          subDepartmentName: pos.subDepartmentName,
          code: pos.code,
          status: pos.status,
        });
      });
    }
  }, [
    selectedMember,
    appliedFilters,
    isFutureMonth,
    attendanceSummary,
    performanceData,
    positions,
    selectedUserDetails,
    positionTags,
  ]);

  return (
    <MainLayout>
      <div style={{
        margin: "0 -24px",
        padding: "10px 24px",
        background: "var(--bg-pure-white)",
        minHeight: "calc(100vh - 64px)"
      }}>
        {/* Header Section (compact) */}
        <div style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <Space size={8} align="center">
            <div style={{
              background: "#eff6ff",
              padding: 6,
              borderRadius: 8,
              color: "#2563eb",
              display: "flex"
            }}>
              <TrendingUp size={16} />
            </div>
            <Title level={4} style={{ margin: 0, fontWeight: 700, color: "var(--text-primary)" }}>Performance Management</Title>
          </Space>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <SearchableDropdown
              placeholder="Select Employee"
              searchPlaceholder="Search employees"
              itemNoun="employees"
              value={selectedMember}
              onChange={(v) => setSelectedMember(v)}
              options={members}
              loading={loading}
              width={260}
              style={{ width: 230, minWidth: 230 }}
            />
            <SearchableDropdown
              placeholder="Month"
              searchPlaceholder="Search months"
              itemNoun="months"
              value={selectedMonth}
              onChange={(v) => v && setSelectedMonth(v)}
              options={months}
              allowClear={false}
              hideAvatar
              width={180}
              style={{ width: 150, minWidth: 150 }}
            />
            <SearchableDropdown
              placeholder="Year"
              searchPlaceholder="Search years"
              itemNoun="years"
              value={selectedYear.toString()}
              onChange={(v) => v && setSelectedYear(Number(v))}
              options={years.map((y) => ({ value: y, label: y }))}
              allowClear={false}
              hideAvatar
              width={150}
              style={{ width: 120, minWidth: 120 }}
            />

            <Button
              type="primary"
              icon={<Filter size={16} />}
              onClick={handleApply}
              disabled={!selectedMember || !selectedMonth || !selectedYear}
              loading={performanceLoading || attendanceLoading}
              style={{
                borderRadius: 8,
                height: 36,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                background: "#2563eb",
                border: "none"
              }}
            >
              Generate Report
            </Button>
          </div>
        </div>

        <Divider style={{ margin: "0 -24px", width: "calc(100% + 48px)", minWidth: "calc(100% + 48px)", borderColor: "var(--border-color)" }} />

        {/* Main Content */}
        {!selectedMember ? (
          <div style={{
            height: "calc(100vh - 250px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--bg-secondary)",
            borderRadius: 24,
            border: "2px dashed var(--border-color)",
            margin: "0 10px",
            textAlign: "center",
            padding: "40px"
          }}>
            <div style={{
              width: 120,
              height: 120,
              background: "var(--bg-pure-white)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
              marginBottom: 24,
              position: "relative",
              border: "1px solid var(--border-color)"
            }}>
              <div style={{
                position: "absolute",
                inset: -8,
                borderRadius: "50%",
                border: "2px solid #eff6ff",
                opacity: 0.5
              }} />
              <UserOutlined style={{ fontSize: 48, color: "#3b82f6" }} />
              <div style={{
                position: "absolute",
                bottom: -4,
                right: -4,
                background: "#10b981",
                width: 32,
                height: 32,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "4px solid var(--bg-pure-white)",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
              }}>
                <Search size={14} color="white" strokeWidth={3} />
              </div>
            </div>
            <Title level={3} style={{ marginBottom: 8, color: "var(--text-primary)", fontWeight: 700 }}>Select an Employee</Title>
            <Text style={{ color: "var(--text-secondary)", fontSize: 16, maxWidth: 400, display: "block", marginBottom: 24 }}>
              Choose a team member from the dropdown above to view their detailed performance insights.
            </Text>
            <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 16px", background: "#eff6ff", borderRadius: 30, color: "#2563eb", fontWeight: 600, fontSize: 13 }}>
              <Activity size={16} />
              <span>Real-time Data Ready</span>
            </div>
          </div>
        ) : !isGenerating ? (
          <div style={{
            height: "calc(100vh - 250px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--bg-pure-white)",
            borderRadius: 24,
            border: "1px solid var(--border-color)",
            margin: "0 10px",
            textAlign: "center",
            padding: "40px",
            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.03)"
          }}>
            <div style={{
              width: 80,
              height: 80,
              background: "#f0f9ff",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
              transform: "rotate(-5deg)",
              border: "1px solid #e0f2fe"
            }}>
              <TrendingUp size={32} color="#0ea5e9" />
            </div>
            <Title level={4} style={{ marginBottom: 8, color: "var(--text-primary)", fontWeight: 700 }}>Ready to Analyze</Title>
            <Text style={{ color: "var(--text-secondary)", fontSize: 14, maxWidth: 320, display: "block", marginBottom: 24 }}>
              The profile for <b>{selectedUserDetails?.label}</b> is selected. Click the <b>Generate</b> button to load performance insights.
            </Text>
            <Button
              type="primary"
              size="large"
              icon={<Filter size={18} />}
              onClick={handleApply}
              style={{ borderRadius: 10, height: 48, padding: "0 32px", background: "#2563eb", border: "none" }}
            >
              Generate Report
            </Button>
          </div>
        ) : (performanceLoading || attendanceLoading || loadingPercent < 100) ? (
          <div style={{
            height: "calc(100vh - 250px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--bg-pure-white)",
            borderRadius: 24,
            border: "1px solid var(--border-color)",
            margin: "0 10px",
            textAlign: "center",
            padding: "40px"
          }}>
            <div style={{ position: "relative", marginBottom: 32 }}>
              <Progress
                type="circle"
                percent={Math.round(loadingPercent)}
                size={180}
                strokeWidth={8}
                strokeColor={{
                  '0%': '#3b82f6',
                  '100%': '#10b981',
                }}
                format={(percent) => (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <span style={{ fontSize: 42, fontWeight: 900, color: "var(--text-primary)", lineHeight: 1 }}>{percent}%</span>
                    <span style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Analyzing</span>
                  </div>
                )}
              />
              <div style={{
                position: "absolute",
                top: -10,
                left: -10,
                right: -10,
                bottom: -10,
                borderRadius: "50%",
                border: "2px solid #eff6ff",
                animation: "pulse 2s infinite"
              }} />
            </div>

            <div style={{ minHeight: 24 }}>
              <Text strong style={{ color: "#334155", fontSize: 16 }}>
                {loadingPercent < 30 ? "Initializing contribution engine..." :
                  loadingPercent < 60 ? "Calculating ticket delivery velocity..." :
                    loadingPercent < 90 ? "Aggregating daily compliance logs..." :
                      "Finalizing dashboard view..."}
              </Text>
            </div>

            <style dangerouslySetInnerHTML={{
              __html: `
              @keyframes pulse {
                0% { transform: scale(1); opacity: 0.5; }
                50% { transform: scale(1.05); opacity: 0.1; }
                100% { transform: scale(1); opacity: 0.5; }
              }
            `}} />
          </div>
        ) : (
          <div className="pm-shell">
            {/* ============================ SIDEBAR ============================ */}
            <aside className="pm-sidebar">
              <div className="pm-side-scroll">
                <div className="pm-side-section-label">Sections</div>
                {/* Section Navigation (Proposals-style rail) */}
                <div className="pm-nav">
                  {[
                    { key: "overview", label: "Overview", icon: <AreaChartOutlined /> },
                    { key: "tickets", label: "Tickets", icon: <FileTextOutlined /> },
                    { key: "daily", label: "Daily Updates", icon: <HistoryOutlined /> },
                    { key: "escalation", label: "Escalation", icon: <WarningOutlined /> },
                  ].map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      className={`pm-nav-item ${activeSection === s.key ? "is-active" : ""}`}
                      onClick={() => setActiveSection(s.key)}
                    >
                      <span className="pm-nav-icon">{s.icon}</span>
                      <span className="pm-nav-label">{s.label}</span>
                      <RightOutlined className="pm-nav-arrow" />
                    </button>
                  ))}
                </div>

                {selectedUserDetails && <div className="pm-side-section-label">Employee</div>}
                {/* Simplified Profile Section (No Card) */}
                {selectedUserDetails && (
                  <div className="pm-emp">
                    {(() => {
                      const samplePos = positions[0] || {};
                      return (
                        <>
                          <div className="pm-emp-head">
                            <div className="pm-emp-avatar-wrap">
                              <Avatar
                                size={64}
                                src={selectedUserDetails.avatarUrl}
                                className="pm-emp-avatar"
                              >
                                {selectedUserDetails.label?.charAt(0)}
                              </Avatar>
                              <span className="pm-emp-status" />
                            </div>
                            <Title level={5} className="pm-emp-name">
                              {selectedUserDetails.label}
                            </Title>
                            {(samplePos.title || samplePos.subDepartmentName) && (
                              <div className="pm-emp-role">
                                {[samplePos.title, samplePos.subDepartmentName].filter(Boolean).join(" · ")}
                              </div>
                            )}
                          </div>

                          <div className="pm-emp-grid">
                            {[
                              { label: "Grade", value: samplePos.gradeName, icon: <StarOutlined /> },
                              { label: "Dept", value: samplePos.departmentName, icon: <BankOutlined /> },
                            ].map((item, idx) => (
                              <div className="pm-emp-tile" key={idx}>
                                <span className="pm-emp-tile-ic">
                                  {React.cloneElement(item.icon as any, { style: { fontSize: 11 } })}
                                </span>
                                <div className="pm-emp-tile-txt">
                                  <span className="pm-emp-tile-label">{item.label}</span>
                                  <Tooltip title={item.value || "N/A"}>
                                    <div className="pm-emp-tile-val">{item.value || "N/A"}</div>
                                  </Tooltip>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      );
                    })()}

                    <Divider style={{ margin: "14px 0", borderColor: "var(--border-color)" }} />

                    {/* Active Projects Section */}
                    {(() => {
                      const allProjects = [
                        ...assignedProjects.map((p: any) => ({ ...p, isAssigned: true })),
                        ...Object.entries(projectStats)
                          .filter(([name]) => !assignedProjects.some((p: any) => p.name === name) && name !== "No Project")
                          .map(([name, count]) => ({ name, count, isAssigned: false, role: "Contributor" }))
                      ];

                      const displayedProjects = showAllProjects ? allProjects : allProjects.slice(0, 2);

                      if (allProjects.length === 0) return null;

                      return (
                        <div style={{ textAlign: "left" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                            <Text strong style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              Active Projects
                            </Text>
                            {allProjects.length > 2 && (
                              <Button
                                type="link"
                                size="small"
                                onClick={() => setShowAllProjects(!showAllProjects)}
                                style={{ padding: 0, height: "auto", fontSize: 10, color: "#3b82f6" }}
                              >
                                {showAllProjects ? "Show Less" : "Show More"}
                              </Button>
                            )}
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {displayedProjects.map((project: any, idx: number) => {
                              const count = project.isAssigned ? (projectStats[project.name] || 0) : project.count;
                              const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
                              const colorIdx = allProjects.indexOf(project);
                              const color = colors[colorIdx % colors.length];

                              return (
                                <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                  <Space size={10} align="center">
                                    <div style={{
                                      width: 22,
                                      height: 22,
                                      borderRadius: 6,
                                      background: project.isAssigned ? `${color}10` : "var(--bg-secondary)",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      color: project.isAssigned ? color : "var(--text-secondary)",
                                      fontSize: 10,
                                      fontWeight: 700,
                                      border: project.isAssigned ? "none" : "1px dashed var(--border-color)"
                                    }}>
                                      {project.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <Text strong style={{ fontSize: 12, color: project.isAssigned ? "var(--text-primary)" : "var(--text-secondary)", display: "block", lineHeight: 1 }}>{project.name}</Text>
                                      <Text type="secondary" style={{ fontSize: 10, display: "block", marginTop: 2 }}>{project.role || (project.isAssigned ? "Member" : "Contributor")}</Text>
                                    </div>
                                  </Space>
                                  <div style={{ fontSize: 11, fontWeight: 600, color: project.isAssigned ? "var(--text-secondary)" : "#cbd5e1" }}>{count}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </aside>

            {/* ============================ MAIN ============================ */}
            <main className="pm-main">
              <div className="pm-main-body">
                {/* ===================== OVERVIEW DASHBOARD ===================== */}
                {selectedMember && activeSection === "overview" && (() => {
                  const score = performanceScore || 0;
                  const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v || 0)));
                  const grade = score >= 85 ? { label: "Excellent", color: "#10b981" }
                    : score >= 70 ? { label: "Good", color: "#2563eb" }
                    : score >= 50 ? { label: "Fair", color: "#f59e0b" }
                    : { label: "Needs Focus", color: "#ef4444" };

                  const periodLabel = (() => {
                    const d = dayjs(`${appliedYear}-${appliedMonth}-01`);
                    return d.isValid() ? d.format("MMMM YYYY") : `${appliedMonth ?? ""} ${appliedYear ?? ""}`.trim();
                  })();

                  const subs = [
                    { label: "Completion", value: clamp(perf.completionScore), color: "#10b981" },
                    { label: "Timeliness", value: clamp(perf.timelinessScore), color: "#2563eb" },
                    { label: "Tracking", value: clamp(perf.trackingScore), color: "#0ea5e9" },
                  ];

                  const kpis = [
                    { label: "Total Tickets", value: ticketSummary.total, sub: `${ticketSummary.completed} completed`, icon: Layers, color: "#2563eb" },
                    { label: "Completion", value: clamp(completionRate), suffix: "%", sub: "of tickets done", icon: TrendingUp, color: "#10b981" },
                    { label: "Daily Updates", value: updateRate, suffix: "%", sub: `${dailyUpdatesSummary.bod + dailyUpdatesSummary.eod} submitted`, icon: Activity, color: "#0ea5e9" },
                    { label: "Attendance", value: !isFutureMonth ? attendanceRate : 0, suffix: "%", sub: `${attendanceSummary.presentDays}/${attendanceSummary.totalDays} days`, icon: Calendar, color: "#14b8a6" },
                  ];

                  const completed = ticketSummary.completed || 0;
                  const inProgress = ticketSummary.inProgress || 0;
                  const pending = ticketSummary.pending || 0;
                  const totalT = ticketSummary.total || 0;
                  const other = Math.max(0, totalT - completed - inProgress - pending);
                  const statusData = [
                    { name: "Completed", value: completed, color: "#10b981" },
                    { name: "In Progress", value: inProgress, color: "#3b82f6" },
                    { name: "Pending", value: pending, color: "#64748b" },
                    ...(other > 0 ? [{ name: "Not Started", value: other, color: "#cbd5e1" }] : []),
                  ].filter((s) => s.value > 0);

                  const escTotal = performanceData?.escalations?.summary?.total ?? (performanceData?.escalations?.details?.length || 0);

                  const allProjects = [
                    ...assignedProjects.map((p: any) => ({ name: p.name, role: p.role || "Member", count: projectStats[p.name] || 0 })),
                    ...Object.entries(projectStats)
                      .filter(([name]) => !assignedProjects.some((p: any) => p.name === name) && name !== "No Project")
                      .map(([name, count]) => ({ name, role: "Contributor", count })),
                  ].slice(0, 4);
                  const projColors = ["#2563eb", "#10b981", "#0ea5e9", "#64748b"];

                  return (
                    <div className="ov">
                      {/* HERO */}
                      <div className="ov-hero">
                        <div className="ov-hero-gauge">
                          <Progress
                            type="circle"
                            percent={clamp(score)}
                            size={104}
                            strokeWidth={9}
                            strokeColor={grade.color}
                            trailColor="var(--bg-secondary)"
                            format={(p) => (
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                <span style={{ fontSize: 24, fontWeight: 900, color: "var(--text-primary)", lineHeight: 1 }}>{p}</span>
                                <span style={{ fontSize: 8, fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "0.08em", marginTop: 2 }}>SCORE</span>
                              </div>
                            )}
                          />
                          <span className="ov-grade" style={{ color: grade.color, background: `${grade.color}14` }}>{grade.label}</span>
                        </div>

                        <div className="ov-hero-main">
                          <div className="ov-hero-head">
                            <div>
                              <div className="ov-eyebrow">Overall Performance</div>
                              <div className="ov-hero-title">{clamp(score)}<span>/100</span></div>
                              <div className="ov-hero-sub">{selectedUserDetails?.label} · {periodLabel}</div>
                            </div>
                          </div>

                          <div className="ov-comp">
                            <div className="ov-comp-item"><span>Ticket Score</span><b style={{ color: "#10b981" }}>{ticketScore}</b></div>
                            <span className="ov-comp-op">−</span>
                            <div className="ov-comp-item"><span>EOD Penalty</span><b style={{ color: "#f59e0b" }}>{eodPenalty}</b></div>
                            <span className="ov-comp-op">−</span>
                            <div className="ov-comp-item"><span>Escalation</span><b style={{ color: "#ef4444" }}>{escalationPenalty}</b></div>
                            <span className="ov-comp-op">=</span>
                            <div className="ov-comp-item is-final"><span>Final Score</span><b>{clamp(score)}</b></div>
                          </div>

                          <div className="ov-subs">
                            {subs.map((s, i) => (
                              <div key={i}>
                                <div className="ov-sub-top">
                                  <span className="ov-sub-lbl">{s.label}</span>
                                  <span className="ov-sub-val">{s.value}%</span>
                                </div>
                                <div className="ov-sub-bar"><div className="ov-sub-fill" style={{ width: `${s.value}%`, background: s.color }} /></div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* KPI TILES */}
                      <div className="ov-kpis">
                        {kpis.map((k: any, i: number) => (
                          <div className="ov-kpi" key={i} style={{ ["--ov-accent" as any]: k.color }}>
                            <div className="ov-kpi-top">
                              <span className="ov-kpi-ic" style={{ background: `${k.color}14`, color: k.color }}><k.icon size={17} /></span>
                            </div>
                            <div className="ov-kpi-val">{k.value}{k.suffix && <small>{k.suffix}</small>}</div>
                            <div className="ov-kpi-lbl">{k.label}</div>
                            {k.sub && <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 6 }}>{k.sub}</div>}
                          </div>
                        ))}
                      </div>

                      {/* LOWER GRID */}
                      <div className="ov-grid">
                        <div className="ov-card">
                          <div className="ov-card-head">
                            <span className="ov-card-title">Ticket Status</span>
                            <span className="ov-card-meta">{totalT} total</span>
                          </div>
                          {totalT === 0 ? (
                            <div style={{ padding: "34px 0", textAlign: "center", color: "var(--text-secondary)", fontSize: 12 }}>No tickets in this period</div>
                          ) : (
                            <div className="ov-donut-wrap">
                              <div className="ov-donut">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={58} paddingAngle={2} stroke="none">
                                      {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                    </Pie>
                                    <RechartsTooltip />
                                  </PieChart>
                                </ResponsiveContainer>
                                <div className="ov-donut-center">
                                  <span className="ov-donut-num">{totalT}</span>
                                  <span className="ov-donut-lbl">Tickets</span>
                                </div>
                              </div>
                              <div className="ov-legend">
                                {statusData.map((s, i) => (
                                  <div className="ov-leg" key={i}>
                                    <span className="ov-leg-dot" style={{ background: s.color }} />
                                    <span className="ov-leg-name">{s.name}</span>
                                    <span className="ov-leg-val">{s.value}</span>
                                    <span className="ov-leg-pct">{totalT > 0 ? Math.round((s.value / totalT) * 100) : 0}%</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="ov-card">
                          <div className="ov-card-head">
                            <span className="ov-card-title">Reporting &amp; Escalations</span>
                            <span className="ov-card-meta">{dailyUpdatesSummary.total} working days</span>
                          </div>
                          <div className="ov-report">
                            {[
                              { label: "BOD Compliance", value: dailyUpdatesSummary.bod, total: dailyUpdatesSummary.total, color: "#10b981" },
                              { label: "EOD Compliance", value: dailyUpdatesSummary.eod, total: dailyUpdatesSummary.total, color: "#2563eb" },
                            ].map((r, i) => {
                              const p = r.total > 0 ? Math.round((r.value / r.total) * 100) : 0;
                              return (
                                <div key={i}>
                                  <div className="ov-rep-top">
                                    <span className="ov-rep-lbl">{r.label}</span>
                                    <span className="ov-rep-val">{r.value}/{r.total} · {p}%</span>
                                  </div>
                                  <div className="ov-rep-bar"><div className="ov-rep-fill" style={{ width: `${p}%`, background: r.color }} /></div>
                                </div>
                              );
                            })}
                            <div className="ov-esc">
                              <span className="ov-esc-ic" style={{ background: escTotal > 0 ? "#fef2f2" : "rgba(16,185,129,0.10)", color: escTotal > 0 ? "#ef4444" : "#10b981" }}>
                                {escTotal > 0 ? <AlertTriangle size={18} /> : <CheckCircleOutlined style={{ fontSize: 18 }} />}
                              </span>
                              <div style={{ flex: 1 }}>
                                <div className="ov-esc-val">{escTotal}</div>
                                <div className="ov-esc-lbl">{escTotal > 0 ? "Escalations need attention" : "No escalations — all clear"}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ACTIVE PROJECTS */}
                      {allProjects.length > 0 && (
                        <div className="ov-card">
                          <div className="ov-card-head">
                            <span className="ov-card-title">Active Projects</span>
                            <span className="ov-card-meta">{allProjects.length} projects</span>
                          </div>
                          <div className="ov-projects">
                            {allProjects.map((p: any, i: number) => (
                              <div className="ov-proj" key={i}>
                                <span className="ov-proj-badge" style={{ background: `${projColors[i % projColors.length]}14`, color: projColors[i % projColors.length] }}>{String(p.name).charAt(0).toUpperCase()}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div className="ov-proj-name">{p.name}</div>
                                  <div className="ov-proj-role">{p.role}</div>
                                </div>
                                <span className="ov-proj-count">{p.count} tickets</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {selectedMember && activeSection === "tickets" && (
                  /* Premium Ticket Performance */
                  <div className="pt-wrap">
                    {/* Section header */}
                    <div className="pt-head">
                      <div className="pt-head-left">
                        <div className="pt-head-icon"><Layers size={18} /></div>
                        <div>
                          <div className="pt-head-title">Ticket Performance</div>
                          <div className="pt-head-sub">Delivery, timeliness &amp; tracking quality for the selected period</div>
                        </div>
                      </div>
                      <div className="pt-head-actions">
                        <div className="pt-score">
                          <span className="pt-score-label">Ticket Score</span>
                          <span className="pt-score-val">{ticketScore}</span>
                        </div>
                        <button type="button" className="pt-breakdown" onClick={() => setBreakdownVisible(true)}>
                          <AreaChartOutlined /> Score Breakdown
                        </button>
                      </div>
                    </div>

                    {/* Distribution — segmented bar + legend */}
                    {(() => {
                      const total = ticketSummary.total || 0;
                      const pct = (v: number) => (total > 0 ? Math.round((v / total) * 100) : 0);

                      const statusStats = [
                        { label: "Completed", value: ticketSummary.completed || 0, color: "#10b981" },
                        { label: "In Progress", value: ticketSummary.inProgress || 0, color: "#3b82f6" },
                        { label: "Pending", value: ticketSummary.pending || 0, color: "#64748b" },
                      ];

                      const segments = [
                        { label: "On Time", value: ticketSummary.onTime || 0, color: "#10b981" },
                        { label: "Delayed", value: ticketSummary.late || 0, color: "#ef4444" },
                        { label: "Not Tracked", value: ticketSummary.untracked || 0, color: "#94a3b8" },
                      ];

                      return (
                        <div className="pt-dist">
                          <div className="pt-dist-top">
                            <div className="pt-dist-total">
                              <span className="pt-dist-total-num">{total}</span>
                              <span className="pt-dist-total-lbl">All Tickets</span>
                            </div>
                            <div className="pt-dist-statuses">
                              {statusStats.map((s, i) => (
                                <div className="pt-dist-status" key={i}>
                                  <span className="pt-dist-status-dot" style={{ background: s.color }} />
                                  <span className="pt-dist-status-val">{s.value}</span>
                                  <span className="pt-dist-status-lbl">{s.label}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-dist-bar">
                            {total === 0 ? (
                              <div className="pt-dist-seg pt-dist-seg-empty" style={{ width: "100%" }} />
                            ) : (
                              segments.map((seg, i) => {
                                const w = (seg.value / total) * 100;
                                if (w <= 0) return null;
                                return (
                                  <Tooltip key={i} title={`${seg.label}: ${seg.value} (${pct(seg.value)}%)`}>
                                    <div className="pt-dist-seg" style={{ width: `${w}%`, background: seg.color }} />
                                  </Tooltip>
                                );
                              })
                            )}
                          </div>

                          <div className="pt-dist-legend">
                            {segments.map((seg, i) => (
                              <div className="pt-dist-leg" key={i}>
                                <span className="pt-dist-leg-dot" style={{ background: seg.color }} />
                                <span className="pt-dist-leg-lbl">{seg.label}</span>
                                <span className="pt-dist-leg-val">{seg.value}</span>
                                <span className="pt-dist-leg-pct">{pct(seg.value)}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Table panel — full detail only on the Tickets section */}
                    {activeSection === "tickets" && (
                    <div className="pt-table-panel">
                      <div className="pt-table-head">
                        <span className="pt-table-title">Ticket Details</span>
                        <span className="pt-table-count">{(performanceData?.tickets?.details || []).length} tickets</span>
                      </div>
                      <Table
                        className="pt-table"
                        columns={[
                          {
                            title: "Ticket",
                            dataIndex: "ticketId",
                            key: "ticketId",
                            width: 120,
                            render: (text: string) => <span className="pt-tid">{text}</span>
                          },
                          {
                            title: "Title",
                            dataIndex: "title",
                            key: "title",
                            ellipsis: true,
                            render: (text: string) => <span className="pt-ttitle">{text}</span>
                          },
                          {
                            title: "Estimate",
                            dataIndex: "estimatedHours",
                            key: "estimatedHours",
                            width: 92,
                            align: "center",
                            render: (hours: number) => <span className="pt-hours" style={{ color: "var(--text-secondary)" }}>{hours || 0}h</span>
                          },
                          {
                            title: "Tracked",
                            dataIndex: "timeSpent",
                            key: "timeSpent",
                            width: 100,
                            align: "center",
                            render: (hours: number, record: any) => {
                              const over = record.estimatedHours > 0 && hours > record.estimatedHours;
                              const h = Math.floor(hours);
                              const m = Math.round((hours - h) * 60);
                              const timeStr = h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}` : `${m}m`;
                              return <span className="pt-hours" style={{ color: over ? "#ef4444" : "#10b981" }}>{timeStr}</span>;
                            }
                          },
                          {
                            title: "Status",
                            dataIndex: "status",
                            key: "status",
                            width: 130,
                            render: (status: string) => {
                              const s = status?.toLowerCase();
                              let color = "#94a3b8";
                              if (["completed", "done", "live"].includes(s)) color = "#10b981";
                              else if (["in progress", "in_progress", "in review"].includes(s)) color = "#3b82f6";
                              else if (["pending", "todo", "open"].includes(s)) color = "#64748b";
                              const formattedStatus = status
                                ? status.split(/[_ ]/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
                                : status;
                              return (
                                <span className="pt-status" style={{ color, background: `${color}14` }}>
                                  <span className="pt-status-dot" style={{ background: color }} />
                                  {formattedStatus}
                                </span>
                              );
                            }
                          },
                          {
                            title: "Compliance",
                            key: "completionStatus",
                            width: 150,
                            render: (_: any, record: any) => {
                              if (!record.timeSpent || record.timeSpent < 0.001 || !record.estimatedHours || record.estimatedHours < 0.001) {
                                return <span className="pt-pill" style={{ color: "#94a3b8", background: "var(--bg-secondary)" }}>Untracked</span>;
                              }
                              const over = record.timeSpent > record.estimatedHours;
                              if (!over) {
                                return <span className="pt-pill" style={{ color: "#10b981", background: "rgba(16,185,129,0.10)" }}>On Budget</span>;
                              }
                              const extraHours = record.timeSpent - record.estimatedHours;
                              const h = Math.floor(extraHours);
                              const m = Math.round((extraHours - h) * 60);
                              const timeStr = h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}` : `${m}m`;
                              return <span className="pt-pill" style={{ color: "#ef4444", background: "rgba(239,68,68,0.10)" }}>{timeStr} over</span>;
                            }
                          }
                        ]}
                        dataSource={performanceData?.tickets?.details || []}
                        rowKey="key"
                        pagination={{ pageSizeOptions: [10, 20, 25, 50, 100], pageSize: 10, size: "small", hideOnSinglePage: true }}
                        size="small"
                        locale={{
                          emptyText: (
                            <div className="pt-empty">
                              <div className="pt-empty-orb"><Layers size={22} /></div>
                              <div className="pt-empty-title">No tickets in this period</div>
                              <div className="pt-empty-sub">There is no ticket activity for this member in the selected month.</div>
                            </div>
                          )
                        }}
                      />
                    </div>
                    )}
                  </div>
                )}

                {selectedMember && activeSection === "daily" && (() => {
                  const du: any = performanceData?.dailyUpdates || {};
                  const totalDays = du.summary?.total || 0;
                  const bod = du.summary?.bod || 0;
                  const eod = du.summary?.eod || 0;
                  const missedBOD = du.missedBOD || [];
                  const missedEOD = du.missedEOD || [];
                  const submitted = bod + eod;
                  const missed = missedBOD.length + missedEOD.length;
                  const totalSlots = submitted + missed;
                  const compliance = totalSlots > 0 ? Math.round((submitted / totalSlots) * 100) : 0;
                  const pct = (v: number) => (totalSlots > 0 ? Math.round((v / totalSlots) * 100) : 0);

                  const missedRows = [
                    ...missedBOD.map((m: any, i: number) => ({ ...m, _type: "BOD", key: m.key ?? `bod-${i}` })),
                    ...missedEOD.map((m: any, i: number) => ({ ...m, _type: "EOD", key: m.key ?? `eod-${i}` })),
                  ];

                  const segments = [
                    { label: "Submitted", value: submitted, color: "#10b981" },
                    { label: "Missed", value: missed, color: "#ef4444" },
                  ];

                  return (
                    <div className="pt-wrap">
                      <div className="pt-head">
                        <div className="pt-head-left">
                          <div className="pt-head-icon"><FileTextOutlined /></div>
                          <div>
                            <div className="pt-head-title">Daily Updates</div>
                            <div className="pt-head-sub">Beginning &amp; end of day reporting compliance for the selected period</div>
                          </div>
                        </div>
                        <div className="pt-head-actions">
                          <div className="pt-score">
                            <span className="pt-score-label">Compliance</span>
                            <span className="pt-score-val">{compliance}%</span>
                          </div>
                          <button type="button" className="pt-breakdown" onClick={() => setDailyBreakdownVisible(true)}>
                            <AreaChartOutlined /> Breakdown
                          </button>
                        </div>
                      </div>

                      <div className="pt-dist">
                        <div className="pt-dist-top">
                          <div className="pt-dist-total">
                            <span className="pt-dist-total-num">{totalDays}</span>
                            <span className="pt-dist-total-lbl">Working Days</span>
                          </div>
                          <div className="pt-dist-statuses">
                            <div className="pt-dist-status">
                              <span className="pt-dist-status-dot" style={{ background: "#10b981" }} />
                              <span className="pt-dist-status-val">{bod}</span>
                              <span className="pt-dist-status-lbl">BOD / {totalDays}</span>
                            </div>
                            <div className="pt-dist-status">
                              <span className="pt-dist-status-dot" style={{ background: "#f59e0b" }} />
                              <span className="pt-dist-status-val">{eod}</span>
                              <span className="pt-dist-status-lbl">EOD / {totalDays}</span>
                            </div>
                          </div>
                        </div>
                        <div className="pt-dist-bar">
                          {totalSlots === 0 ? (
                            <div className="pt-dist-seg pt-dist-seg-empty" style={{ width: "100%" }} />
                          ) : (
                            segments.map((seg, i) => {
                              const w = (seg.value / totalSlots) * 100;
                              if (w <= 0) return null;
                              return (
                                <Tooltip key={i} title={`${seg.label}: ${seg.value} (${pct(seg.value)}%)`}>
                                  <div className="pt-dist-seg" style={{ width: `${w}%`, background: seg.color }} />
                                </Tooltip>
                              );
                            })
                          )}
                        </div>
                        <div className="pt-dist-legend">
                          {segments.map((seg, i) => (
                            <div className="pt-dist-leg" key={i}>
                              <span className="pt-dist-leg-dot" style={{ background: seg.color }} />
                              <span className="pt-dist-leg-lbl">{seg.label}</span>
                              <span className="pt-dist-leg-val">{seg.value}</span>
                              <span className="pt-dist-leg-pct">{pct(seg.value)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-table-panel">
                        <div className="pt-table-head">
                          <span className="pt-table-title">Missed Updates</span>
                          <span className="pt-table-count">{missedRows.length} missed</span>
                        </div>
                        <Table
                          className="pt-table"
                          columns={[
                            {
                              title: "Type",
                              dataIndex: "_type",
                              key: "_type",
                              width: 110,
                              render: (t: string) => <span className="pt-tid">{t}</span>
                            },
                            {
                              title: "Date",
                              dataIndex: "date",
                              key: "date",
                              render: (d: string) => <span className="pt-ttitle">{dayjs(d).format("DD MMM (ddd)")}</span>
                            },
                            {
                              title: "Status",
                              key: "status",
                              width: 120,
                              align: "right",
                              render: () => <span className="pt-pill" style={{ color: "#ef4444", background: "#fef2f2" }}>Missed</span>
                            }
                          ]}
                          dataSource={missedRows}
                          rowKey="key"
                          pagination={{ pageSizeOptions: [10, 20, 25, 50, 100], pageSize: 10, size: "small", hideOnSinglePage: true }}
                          size="small"
                          locale={{
                            emptyText: (
                              <div className="pt-empty">
                                <div className="pt-empty-orb" style={{ color: "#10b981", background: "rgba(16,185,129,0.08)" }}><CheckCircleOutlined style={{ fontSize: 22 }} /></div>
                                <div className="pt-empty-title">No missed updates</div>
                                <div className="pt-empty-sub">All beginning &amp; end of day updates were submitted for this period.</div>
                              </div>
                            )
                          }}
                        />
                      </div>
                    </div>
                  );
                })()}

                {selectedMember && activeSection === "escalation" && (() => {
                  const esc: any = performanceData?.escalations || {};
                  const details = esc.details || [];
                  const total = esc.summary?.total ?? details.length;

                  const active = details.filter((d: any) => d.status === "OPEN").length;
                  const progress = details.filter((d: any) => d.status === "IN_PROGRESS").length;
                  const resolved = details.filter((d: any) => d.status === "RESOLVED" || d.status === "CLOSED").length;

                  const high = details.filter((d: any) => d.priority === "HIGH" || d.priority === "URGENT").length;
                  const medium = details.filter((d: any) => d.priority === "MEDIUM").length;
                  const low = details.filter((d: any) => d.priority === "LOW" || !d.priority).length;

                  const denom = active + progress + resolved;
                  const pct = (v: number) => (denom > 0 ? Math.round((v / denom) * 100) : 0);

                  const segments = [
                    { label: "Active", value: active, color: "#ef4444" },
                    { label: "In Progress", value: progress, color: "#3b82f6" },
                    { label: "Resolved", value: resolved, color: "#10b981" },
                  ];

                  return (
                    <div className="pt-wrap">
                      <div className="pt-head">
                        <div className="pt-head-left">
                          <div className="pt-head-icon" style={{ background: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)", color: "#e11d48" }}>
                            <AlertTriangle size={16} />
                          </div>
                          <div>
                            <div className="pt-head-title">Escalations</div>
                            <div className="pt-head-sub">Issues raised &amp; their resolution status for the selected period</div>
                          </div>
                        </div>
                        <div className="pt-head-actions">
                          <div className="pt-score">
                            <span className="pt-score-label">Total</span>
                            <span className="pt-score-val" style={{ background: "#e11d48" }}>{total}</span>
                          </div>
                          <button type="button" className="pt-breakdown" onClick={() => setEscalationBreakdownVisible(true)}>
                            <AreaChartOutlined /> Breakdown
                          </button>
                        </div>
                      </div>

                      {details.length === 0 ? (
                        <div className="pt-table-panel">
                          <div className="pt-empty">
                            <div className="pt-empty-orb" style={{ color: "#10b981", background: "rgba(16,185,129,0.08)" }}><CheckCircleOutlined style={{ fontSize: 22 }} /></div>
                            <div className="pt-empty-title">No escalations recorded</div>
                            <div className="pt-empty-sub">No escalations for {selectedUserDetails?.label} in this period. Keep up the great work.</div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="pt-dist">
                            <div className="pt-dist-top">
                              <div className="pt-dist-total">
                                <span className="pt-dist-total-num">{total}</span>
                                <span className="pt-dist-total-lbl">Total Escalations</span>
                              </div>
                              <div className="pt-dist-statuses">
                                <div className="pt-dist-status">
                                  <span className="pt-dist-status-dot" style={{ background: "#e11d48" }} />
                                  <span className="pt-dist-status-val">{high}</span>
                                  <span className="pt-dist-status-lbl">High</span>
                                </div>
                                <div className="pt-dist-status">
                                  <span className="pt-dist-status-dot" style={{ background: "#f59e0b" }} />
                                  <span className="pt-dist-status-val">{medium}</span>
                                  <span className="pt-dist-status-lbl">Medium</span>
                                </div>
                                <div className="pt-dist-status">
                                  <span className="pt-dist-status-dot" style={{ background: "#64748b" }} />
                                  <span className="pt-dist-status-val">{low}</span>
                                  <span className="pt-dist-status-lbl">Low</span>
                                </div>
                              </div>
                            </div>
                            <div className="pt-dist-bar">
                              {denom === 0 ? (
                                <div className="pt-dist-seg pt-dist-seg-empty" style={{ width: "100%" }} />
                              ) : (
                                segments.map((seg, i) => {
                                  const w = (seg.value / denom) * 100;
                                  if (w <= 0) return null;
                                  return (
                                    <Tooltip key={i} title={`${seg.label}: ${seg.value} (${pct(seg.value)}%)`}>
                                      <div className="pt-dist-seg" style={{ width: `${w}%`, background: seg.color }} />
                                    </Tooltip>
                                  );
                                })
                              )}
                            </div>
                            <div className="pt-dist-legend">
                              {segments.map((seg, i) => (
                                <div className="pt-dist-leg" key={i}>
                                  <span className="pt-dist-leg-dot" style={{ background: seg.color }} />
                                  <span className="pt-dist-leg-lbl">{seg.label}</span>
                                  <span className="pt-dist-leg-val">{seg.value}</span>
                                  <span className="pt-dist-leg-pct">{pct(seg.value)}%</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-table-panel">
                            <div className="pt-table-head">
                              <span className="pt-table-title">Escalation Details</span>
                              <span className="pt-table-count">{details.length} issues</span>
                            </div>
                            <Table
                              className="pt-table"
                              columns={[
                                {
                                  title: "Issue Details",
                                  dataIndex: "subject",
                                  key: "subject",
                                  ellipsis: true,
                                  render: (text: string, record: any) => (
                                    <div>
                                      <div className="pt-ttitle">{text}</div>
                                      <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{record.category || "General Issue"}</div>
                                    </div>
                                  )
                                },
                                {
                                  title: "Priority",
                                  dataIndex: "priority",
                                  key: "priority",
                                  width: 110,
                                  align: "center",
                                  render: (priority: string) => {
                                    let color = "#64748b";
                                    let bg = "var(--bg-secondary)";
                                    if (priority === "HIGH" || priority === "URGENT") { color = "#e11d48"; bg = "#fff1f2"; }
                                    if (priority === "MEDIUM") { color = "#d97706"; bg = "#fffbeb"; }
                                    return <span className="pt-pill" style={{ color, background: bg }}>{priority || "LOW"}</span>;
                                  }
                                },
                                {
                                  title: "Status",
                                  dataIndex: "status",
                                  key: "status",
                                  width: 130,
                                  align: "right",
                                  render: (status: string) => {
                                    const config: any = {
                                      OPEN: { color: "#ef4444", label: "Active" },
                                      IN_PROGRESS: { color: "#3b82f6", label: "In Progress" },
                                      RESOLVED: { color: "#10b981", label: "Resolved" },
                                      CLOSED: { color: "#10b981", label: "Closed" }
                                    };
                                    const s = config[status] || { color: "var(--text-secondary)", label: status };
                                    return (
                                      <span className="pt-status" style={{ color: s.color, background: `${s.color}14`, justifyContent: "flex-end" }}>
                                        <span className="pt-status-dot" style={{ background: s.color }} />
                                        {s.label}
                                      </span>
                                    );
                                  }
                                }
                              ]}
                              dataSource={details}
                              rowKey="id"
                              pagination={{ pageSizeOptions: [10, 20, 25, 50, 100], pageSize: 10, size: "small", hideOnSinglePage: true }}
                              size="small"
                              onRow={(record) => ({
                                onClick: () => handleRowClick(record),
                                style: { cursor: "pointer" }
                              })}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>
            </main>
          </div>
        )}

        {/* Escalation Detail Drawer */}
        <Drawer
          title={
            <Space direction="vertical" size={2}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertOutlined style={{ color: "var(--color-info)" }} />
                <Title level={4} style={{ margin: 0 }}>Escalation Details</Title>
              </div>
              {fullEscalation && (
                <Text type="secondary" style={{ fontSize: 11, fontWeight: 400 }}>
                  ID: {fullEscalation.id?.split('-')[0].toUpperCase()} • Raised on {dayjs(fullEscalation.createdAt).format('MMM D, YYYY at HH:mm')}
                </Text>
              )}
            </Space>
          }
          placement="right"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          width={600}
          styles={{
            header: { borderBottom: '1px solid var(--border-color)', padding: '16px 24px', background: 'var(--bg-pure-white)' },
            body: { padding: 0, background: 'var(--bg-secondary)' },
            footer: { borderTop: '1px solid var(--border-color)', padding: '12px 24px', background: 'var(--bg-pure-white)' }
          }}
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button onClick={() => setDrawerVisible(false)}>Close</Button>
            </div>
          }
        >
          {loadingDetails ? (
            <div style={{ padding: 40, textAlign: 'center' }}><Spin /></div>
          ) : fullEscalation && (
            <div style={{ padding: '24px' }}>
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Card styles={{ body: { padding: '12px 18px', background: 'var(--bg-pure-white)', border: '1px solid var(--border-color)', borderRadius: 12 } }}>
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subject</Text>
                      <Title level={4} style={{ margin: '2px 0 0 0', fontWeight: 700, color: 'var(--text-primary)' }}>{fullEscalation?.subject}</Title>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <Text type="secondary" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>Status</Text>
                        <div style={{ marginTop: 4 }}>
                          <Tag color={fullEscalation?.status === 'OPEN' ? 'error' : 'success'} style={{ borderRadius: 6, fontWeight: 600 }}>{fullEscalation?.status}</Tag>
                        </div>
                      </div>
                      <div>
                        <Text type="secondary" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>Priority</Text>
                        <div style={{ marginTop: 4 }}>
                          <Tag color={fullEscalation?.priority?.name === 'HIGH' ? 'error' : 'blue'} style={{ borderRadius: 4, fontWeight: 600 }}>{fullEscalation?.priority?.name || 'MEDIUM'}</Tag>
                        </div>
                      </div>
                    </div>
                  </Space>
                </Card>

                <Row gutter={[24, 24]}>
                  <Col span={12}>
                    <Space direction="vertical" size={2}>
                      <Text type="secondary" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
                        <ProjectOutlined /> Category
                      </Text>
                      <Tag color="blue" style={{ borderRadius: 4, background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>{fullEscalation?.category?.name || 'General'}</Tag>
                    </Space>
                  </Col>
                  <Col span={12}>
                    <Space direction="vertical" size={2}>
                      <Text type="secondary" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
                        Related Project
                      </Text>
                      <Text strong style={{ fontSize: 13 }}>{fullEscalation?.project?.name || 'N/A'}</Text>
                    </Space>
                  </Col>
                </Row>

                <Divider style={{ margin: 0 }} />

                <div>
                  <Space align="center" style={{ marginBottom: 8 }}>
                    <FileTextOutlined style={{ color: "var(--color-info)", fontSize: 14 }} />
                    <Text strong style={{ fontSize: 14 }}>Detailed Description</Text>
                  </Space>
                  <div style={{
                    padding: '16px',
                    background: 'var(--bg-pure-white)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 10,
                    fontSize: 13,
                    lineHeight: '1.5',
                    color: 'var(--text-primary)',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {fullEscalation?.description}
                  </div>
                </div>

                {fullEscalation.tickets && fullEscalation.tickets.length > 0 && (
                  <div>
                    <Space align="center" style={{ marginBottom: 10 }}>
                      <Text strong style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Linked Development Tickets</Text>
                    </Space>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {fullEscalation.tickets.map((t: any, idx: any) => (
                        <Tag key={idx} color="blue" style={{ borderRadius: 4, margin: 0, padding: '4px 8px', border: '1px solid #bae6fd' }}>
                          <Space size={4}>
                            <Text strong style={{ fontSize: 11, color: '#0369a1' }}>{t.ticket?.ticketNumber}</Text>
                            <Text style={{ fontSize: 11, color: '#0ea5e9' }}>{t.ticket?.title}</Text>
                          </Space>
                        </Tag>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Space align="center" style={{ marginBottom: 10 }}>
                    <Text strong style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Target Team Members</Text>
                  </Space>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {fullEscalation.targetMembers?.map((m: any, idx: any) => (
                      <div key={idx} style={{
                        padding: '4px 10px 4px 4px',
                        background: 'var(--bg-pure-white)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 20,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                      }}>
                        <Avatar
                          size={24}
                          src={m.user?.avatarUrl}
                          style={{ backgroundColor: "#2563eb", fontSize: 10 }}
                        >
                          {m.user?.name?.charAt(0)}
                        </Avatar>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Text strong style={{ fontSize: 12, color: 'var(--text-primary)' }}>{m.user?.name}</Text>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Divider style={{ margin: 0 }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                  <Space size={10}>
                    <Avatar
                      size="small"
                      src={fullEscalation?.createdBy?.avatarUrl}
                      style={{ backgroundColor: '#64748b' }}
                    >
                      {fullEscalation?.createdBy?.name?.charAt(0)}
                    </Avatar>
                    <div>
                      <Text type="secondary" style={{ fontSize: 10, display: 'block' }}>Raised By</Text>
                      <Text strong style={{ fontSize: 12, color: 'var(--text-primary)' }}>{fullEscalation?.createdBy?.name}</Text>
                    </div>
                  </Space>
                  <Space size={10}>
                    <HistoryOutlined style={{ color: 'var(--text-secondary)', fontSize: 14 }} />
                    <div>
                      <Text type="secondary" style={{ fontSize: 10, display: 'block' }}>Last Updated</Text>
                      <Text strong style={{ fontSize: 12 }}>{dayjs(fullEscalation?.updatedAt).fromNow()}</Text>
                    </div>
                  </Space>
                </div>
              </Space>
            </div>
          )}
        </Drawer>

        {/* Ticket performance breakdown slider */}
        <Drawer
          title={
            <Space>
              <div style={{ background: "#f0f9ff", padding: "6px", borderRadius: "8px", display: "flex" }}>
                <AreaChartOutlined style={{ color: "#0ea5e9" }} />
              </div>
              <span style={{ fontWeight: 700 }}>Ticket Performance Breakdown</span>
            </Space>
          }
          placement="right"
          width={450}
          onClose={() => setBreakdownVisible(false)}
          open={breakdownVisible}
          styles={{
            header: { borderBottom: '1px solid var(--border-color)', padding: '16px 24px', background: 'var(--bg-pure-white)' },
            body: { padding: '24px', background: 'var(--bg-secondary)' }
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Header Summary */}
            <div style={{
              background: "var(--bg-secondary)",
              padding: "12px 20px",
              borderRadius: "16px",
              border: "1px solid var(--border-color)",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
            }}>
              <Text strong style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
                Weighted Ticket Score
              </Text>
              <div style={{ fontSize: 36, fontWeight: 900, color: "#0ea5e9", lineHeight: 1 }}>{ticketScore}</div>
              <Text type="secondary" style={{ fontSize: 10, marginTop: 4, display: "block", color: "var(--text-secondary)" }}>
                Calculated from completion, timeliness, and tracking.
              </Text>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Completion Score */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
                  <div>
                    <Text strong style={{ fontSize: 14, color: "var(--text-primary)", display: "block" }}>Completion Score</Text>
                    <Text type="secondary" style={{ fontSize: 11, color: "var(--text-secondary)" }}>Weight: 50%</Text>
                  </div>
                  <Text strong style={{ fontSize: 18, color: "#10b981" }}>{perf.completionScore}%</Text>
                </div>
                <Progress percent={perf.completionScore} strokeColor="#10b981" showInfo={false} strokeWidth={8} style={{ marginBottom: 4 }} />
                <div style={{ fontSize: 12, background: "var(--bg-secondary)", padding: "10px 14px", borderRadius: "10px", color: "#475569", border: "1px solid var(--border-color)" }}>
                  <div style={{ marginBottom: 4 }}>
                    <Text strong style={{ color: "#10b981", fontSize: 13 }}>{ticketSummary.completed}</Text> of <Text strong style={{ fontSize: 13 }}>{ticketSummary.total}</Text> tickets completed.
                  </div>
                  {ticketSummary.total > ticketSummary.completed && (() => {
                    const incompleteCount = ticketSummary.total - ticketSummary.completed;
                    const incompletePercent = Math.round((incompleteCount / ticketSummary.total) * 100);
                    const totalReduction = incompletePercent * 2; // User's requested formula (since weight is 50%, 1% incomplete = 2% reduction of completion max)

                    return (
                      <div style={{ color: "#ef4444", marginBottom: 4, fontWeight: 500 }}>
                        • {incompleteCount} tickets not completed ({incompletePercent}% of total).
                        <div style={{ fontSize: 11, marginTop: 2, fontWeight: 600 }}>
                          {incompletePercent}% × 2 = {totalReduction}% total reduction from 100%
                        </div>
                      </div>
                    );
                  })()}
                  <div style={{ fontSize: 10, opacity: 0.7 }}>Formula: (Completed / Total) * 100</div>
                </div>
              </div>

              {/* Timeliness Score */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
                  <div>
                    <Text strong style={{ fontSize: 14, color: "var(--text-primary)", display: "block" }}>Timeliness Score</Text>
                    <Text type="secondary" style={{ fontSize: 11, color: "var(--text-secondary)" }}>Weight: 40%</Text>
                  </div>
                  <Text strong style={{ fontSize: 18, color: "#f59e0b" }}>{perf.timelinessScore}%</Text>
                </div>
                <Progress percent={perf.timelinessScore} strokeColor="#f59e0b" showInfo={false} strokeWidth={8} style={{ marginBottom: 4 }} />
                <div style={{ fontSize: 12, background: "var(--bg-secondary)", padding: "10px 14px", borderRadius: "10px", color: "#475569", border: "1px solid var(--border-color)" }}>
                  <div style={{ marginBottom: 4 }}>
                    <Text strong style={{ color: "#10b981", fontSize: 13 }}>{ticketSummary.onTime}</Text> out of <Text strong style={{ fontSize: 13 }}>{ticketSummary.total}</Text> total tickets were on time (Dev Complete).
                  </div>
                  {ticketSummary.total > ticketSummary.onTime && (
                    <div style={{ color: "#f59e0b", marginBottom: 4, fontWeight: 500 }}>
                      • {ticketSummary.total - ticketSummary.onTime} tickets were delayed, impacting the timeliness score.
                    </div>
                  )}
                  <div style={{ fontSize: 10, opacity: 0.7 }}>Formula: (On-Time / Total) * 100</div>
                </div>
              </div>

              {/* Tracking Score */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
                  <div>
                    <Text strong style={{ fontSize: 14, color: "var(--text-primary)", display: "block" }}>Tracking Quality</Text>
                    <Text type="secondary" style={{ fontSize: 11, color: "var(--text-secondary)" }}>Weight: 10%</Text>
                  </div>
                  <Text strong style={{ fontSize: 18, color: "#3b82f6" }}>{perf.trackingScore}%</Text>
                </div>
                <Progress percent={perf.trackingScore} strokeColor="#3b82f6" showInfo={false} strokeWidth={8} style={{ marginBottom: 4 }} />
                <div style={{ fontSize: 12, background: "var(--bg-secondary)", padding: "10px 14px", borderRadius: "10px", color: "#475569", border: "1px solid var(--border-color)" }}>
                  <div style={{ marginBottom: 4 }}>
                    <Text strong style={{ color: "#10b981", fontSize: 13 }}>{ticketSummary.total - ticketSummary.untracked}</Text> out of <Text strong style={{ fontSize: 13 }}>{ticketSummary.total}</Text> total tickets had time logs.
                  </div>
                  {ticketSummary.untracked > 0 && (
                    <div style={{ color: "#3b82f6", marginBottom: 4, fontWeight: 500 }}>
                      • {ticketSummary.untracked} tickets were untracked, lowering the tracking quality.
                    </div>
                  )}
                  <div style={{ fontSize: 10, opacity: 0.7 }}>Formula: ((Total - Untracked) / Total) * 100</div>
                </div>
              </div>
            </div>

            <Divider style={{ margin: "8px 0" }} />

            <div style={{ background: "#fef2f2", padding: "16px", borderRadius: "12px", border: "1px solid #fee2e2" }}>
              <Text strong style={{ fontSize: 13, color: "#991b1b", display: "block", marginBottom: 8 }}>Score Calculation Note</Text>
              <Text style={{ fontSize: 11, color: "#b91c1c", display: "block" }}>
                The <b>Ticket Score</b> is the weighted sum of above metrics.
                Penalties for missed EODs and Escalations are subtracted
                separately from this score to reach the final 0-100 Performance Score.
              </Text>
            </div>
          </div>
        </Drawer>

        {/* Daily updates performance breakdown slider */}
        <Drawer
          title={
            <Space>
              <div style={{ background: "var(--bg-secondary)", padding: "6px", borderRadius: "8px", display: "flex" }}>
                <FileTextOutlined style={{ color: "var(--text-secondary)" }} />
              </div>
              <span style={{ fontWeight: 700 }}>Daily Updates Breakdown</span>
            </Space>
          }
          placement="right"
          width={450}
          onClose={() => setDailyBreakdownVisible(false)}
          open={dailyBreakdownVisible}
          styles={{
            header: { borderBottom: '1px solid var(--border-color)', padding: '16px 24px' },
            body: { padding: '24px' }
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Header Summary */}
            <div style={{ background: isDark ? "var(--bg-secondary)" : "linear-gradient(135deg, var(--bg-secondary) 0%, var(--border-color) 100%)", padding: "16px 20px", borderRadius: "16px", border: "1px solid var(--border-color)" }}>
              <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>Total EOD Penalty</Text>
              <div style={{ fontSize: 36, fontWeight: 900, color: "#f59e0b", marginTop: 2, lineHeight: 1 }}>-{perf.eodPenalty}</div>
              <Text type="secondary" style={{ fontSize: 10, marginTop: 4, display: "block", color: "var(--text-secondary)" }}>Subtracted from the final performance score.</Text>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* BOD Section */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
                  <div>
                    <Text strong style={{ fontSize: 14, color: "var(--text-primary)", display: "block" }}>BOD Compliance</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>Beginning of Day Updates</Text>
                  </div>
                  <Text strong style={{ fontSize: 18, color: "#10b981" }}>
                    {performanceData?.dailyUpdates?.summary?.total ? Math.round(((performanceData?.dailyUpdates?.summary?.bod ?? 0) / performanceData?.dailyUpdates?.summary?.total) * 100) : 0}%
                  </Text>
                </div>
                <div style={{ fontSize: 12, background: isDark ? "rgba(16, 185, 129, 0.1)" : "#f0fdf4", padding: "12px", borderRadius: "10px", color: isDark ? "#34d399" : "#166534", border: `1px solid ${isDark ? "rgba(16, 185, 129, 0.2)" : "#dcfce7"}` }}>
                  <Text strong style={{ color: isDark ? "#34d399" : "#15803d" }}>{(performanceData?.dailyUpdates?.summary as any)?.bod ?? 0}</Text> out of <Text strong style={{ color: "inherit" }}>{(performanceData?.dailyUpdates?.summary as any)?.total ?? 0}</Text> BODs submitted.
                </div>
              </div>

              {/* EOD Section with Penalty Math */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
                  <div>
                    <Text strong style={{ fontSize: 14, color: "var(--text-primary)", display: "block" }}>EOD Compliance</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>End of Day Updates</Text>
                  </div>
                  <Text strong style={{ fontSize: 18, color: "#f59e0b" }}>
                    {performanceData?.dailyUpdates?.summary?.total ? Math.round(((performanceData?.dailyUpdates?.summary?.eod ?? 0) / performanceData?.dailyUpdates?.summary?.total) * 100) : 0}%
                  </Text>
                </div>
                <div style={{ fontSize: 12, background: isDark ? "rgba(245, 158, 11, 0.1)" : "#fffbeb", padding: "12px", borderRadius: "10px", color: isDark ? "#fbbf24" : "#92400e", border: `1px solid ${isDark ? "rgba(245, 158, 11, 0.2)" : "#fef3c7"}` }}>
                  <div style={{ marginBottom: 4 }}>
                    <Text strong style={{ color: isDark ? "#fbbf24" : "#b45309" }}>{(performanceData?.dailyUpdates?.summary as any)?.eod ?? 0}</Text> out of <Text strong style={{ color: "inherit" }}>{(performanceData?.dailyUpdates?.summary as any)?.total ?? 0}</Text> EODs submitted.
                  </div>
                  {(performanceData?.dailyUpdates?.summary?.missedEOD ?? 0) > 0 && (
                    <div style={{ color: isDark ? "#f87171" : "#ef4444", fontWeight: 600, marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${isDark ? "rgba(245, 158, 11, 0.3)" : "#fcd34d"}` }}>
                      • {performanceData?.dailyUpdates?.summary?.missedEOD} missed EODs
                      <div style={{ fontSize: 13, marginTop: 2 }}>
                        {performanceData?.dailyUpdates?.summary?.missedEOD ?? 0} × 0.75 = {perf.eodPenalty} point reduction
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* List of Missed Updates */}
              {((performanceData?.dailyUpdates?.missedBOD?.length ?? 0) > 0 || (performanceData?.dailyUpdates?.missedEOD?.length ?? 0) > 0) && (
                <div>
                  <Text strong style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.025em" }}>
                    Missed Updates Details
                  </Text>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {[
                      ...(performanceData?.dailyUpdates?.missedBOD || []).map((m: any) => ({ ...m, type: 'BOD' })),
                      ...(performanceData?.dailyUpdates?.missedEOD || []).map((m: any) => ({ ...m, type: 'EOD' }))
                    ].sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix()).map((missed, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--bg-secondary)", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                        <Space size={8}>
                          <Tag color={missed.type === 'BOD' ? "cyan" : "orange"} style={{ borderRadius: 4, fontSize: 10, margin: 0 }}>{missed.type}</Tag>
                          <Text strong style={{ fontSize: 12 }}>{dayjs(missed.date).format('MMM DD, YYYY')}</Text>
                        </Space>
                        <Tag color="error" style={{ borderRadius: 6, fontSize: 10, margin: 0 }}>Missed</Tag>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Drawer>

        {/* Escalation performance breakdown slider */}
        <Drawer
          title={
            <Space>
              <div style={{ background: "#fff1f2", padding: "6px", borderRadius: "8px", display: "flex" }}>
                <WarningOutlined style={{ color: "#e11d48" }} />
              </div>
              <span style={{ fontWeight: 700 }}>Escalations Breakdown</span>
            </Space>
          }
          placement="right"
          width={450}
          onClose={() => setEscalationBreakdownVisible(false)}
          open={escalationBreakdownVisible}
          styles={{
            header: { borderBottom: '1px solid var(--border-color)', padding: '16px 24px' },
            body: { padding: '24px' }
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Header Summary */}
            <div style={{ background: isDark ? "rgba(225, 29, 72, 0.15)" : "linear-gradient(135deg, #fff1f2 0%, #fff5f5 100%)", padding: "16px 20px", borderRadius: "16px", border: `1px solid ${isDark ? "#9f1239" : "#fecdd3"}` }}>
              <Text strong style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: isDark ? "#fb7185" : "var(--text-secondary)" }}>Total Escalation Penalty</Text>
              <div style={{ fontSize: 36, fontWeight: 900, color: "#e11d48", marginTop: 2, lineHeight: 1 }}>-{perf.escalationPenalty}</div>
              <Text type="secondary" style={{ fontSize: 10, marginTop: 4, display: "block", color: isDark ? "#fda4af" : "var(--text-secondary)" }}>Subtracted from the final performance score (Max -25).</Text>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Penalty Math Section */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
                  <div>
                    <Text strong style={{ fontSize: 14, color: "var(--text-primary)", display: "block" }}>Escalation Count</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>Total weighted impact</Text>
                  </div>
                  <Text strong style={{ fontSize: 18, color: "#e11d48" }}>
                    {performanceData?.escalations?.summary?.total ?? 0}
                  </Text>
                </div>
                <div style={{ fontSize: 12, background: "#fff5f5", padding: "12px", borderRadius: "10px", color: "#991b1b", border: "1px solid #fee2e2" }}>
                  <div style={{ marginBottom: 4 }}>
                    <Text strong style={{ color: "#e11d48" }}>{performanceData?.escalations?.summary?.total ?? 0}</Text> escalations recorded in this period.
                  </div>
                  {(performanceData?.escalations?.summary?.total ?? 0) > 0 && (
                    <div style={{ color: "#e11d48", fontWeight: 600, marginTop: 8, paddingTop: 8, borderTop: "1px dashed #fca5a5" }}>
                      • Penalty Calculation:
                      <div style={{ fontSize: 13, marginTop: 2 }}>
                        {performanceData?.escalations?.summary?.total ?? 0} × 2.5 = {(performanceData?.escalations?.summary?.total ?? 0) * 2.5} point reduction
                      </div>
                      {((performanceData?.escalations?.summary?.total ?? 0) * 2.5) > 25 && (
                        <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4, fontWeight: 500 }}>
                          (Capped at maximum penalty of -25 points)
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <Divider style={{ margin: "8px 0" }} />

              <div style={{ background: "var(--bg-secondary)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                <Text strong style={{ fontSize: 13, color: "#475569", display: "block", marginBottom: 8 }}>Impact on Professionalism</Text>
                <Text style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", lineHeight: "1.6" }}>
                  Escalations represent missed expectations or process deviations.
                  Each escalation negatively impacts the weighted performance score
                  to ensure high quality of ticket execution and collaboration.
                </Text>
              </div>
            </div>
          </div>
        </Drawer>

        <style dangerouslySetInnerHTML={{
          __html: `
          .header-select .ant-select-selector {
            border-radius: 10px !important;
            border-color: var(--border-color) !important;
            background: var(--bg-pure-white) !important;
          }
          .header-select .ant-select-selection-placeholder {
            color: var(--text-secondary) !important;
          }
          .ant-table-thead > tr > th {
            background: var(--bg-secondary) !important;
            color: var(--text-secondary) !important;
            font-weight: 600 !important;
            text-transform: uppercase !important;
            font-size: 11px !important;
            letter-spacing: 0.05em !important;
          }
          .ant-table-row:hover > td {
            background: var(--bg-secondary) !important;
          }
          .ant-card {
            box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05) !important;
            background: var(--bg-pure-white) !important;
          }
          /* ---------------- Proposals-style shell ---------------- */
          .pm-shell {
            display: flex;
            margin: 0 -24px;
            background: var(--bg-pure-white);
          }
          .pm-sidebar {
            width: 346px;
            flex-shrink: 0;
            border-right: 1px solid var(--border-color);
            background: var(--bg-pure-white);
            display: flex;
            flex-direction: column;
            padding: 4px 16px 0 28px;
            position: sticky;
            top: 0;
            align-self: flex-start;
            height: calc(100vh - 130px);
          }
          .pm-side-scroll {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            margin: 0 -6px;
            padding: 0 6px 16px;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .pm-side-scroll::-webkit-scrollbar { display: none; }
          .pm-side-section-label {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.07em;
            color: var(--text-secondary);
            padding: 0 8px;
            margin: 16px 0 6px;
          }
          .pm-side-scroll > .pm-side-section-label:first-child { margin-top: 4px; }

          /* ---------------- Section nav ---------------- */
          .pm-nav {
            display: flex;
            flex-direction: column;
            gap: 3px;
          }
          .pm-nav-item {
            position: relative;
            display: flex;
            align-items: center;
            gap: 11px;
            width: 100%;
            padding: 8px 11px;
            border: none;
            background: transparent;
            cursor: pointer;
            border-radius: 10px;
            text-align: left;
            transition: background 0.15s ease;
          }
          .pm-nav-item:hover { background: var(--bg-secondary); }
          .pm-nav-item.is-active {
            background: linear-gradient(135deg, rgba(37, 99, 235, 0.10) 0%, rgba(37, 99, 235, 0.03) 100%);
          }
          .pm-nav-item.is-active::before {
            content: "";
            position: absolute;
            left: 0; top: 50%;
            transform: translateY(-50%);
            width: 3px; height: 18px;
            border-radius: 0 3px 3px 0;
            background: #2563eb;
          }
          .pm-nav-icon {
            width: 28px;
            height: 28px;
            flex-shrink: 0;
            border-radius: 8px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            color: var(--text-secondary);
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            transition: all 0.15s ease;
          }
          .pm-nav-item:hover .pm-nav-icon { color: var(--text-primary); }
          .pm-nav-item.is-active .pm-nav-icon {
            color: #fff;
            background: #2563eb;
            border-color: #2563eb;
            box-shadow: 0 2px 6px rgba(37, 99, 235, 0.30);
          }
          .pm-nav-label {
            flex: 1;
            font-size: 13px;
            font-weight: 500;
            color: var(--text-primary);
            transition: color 0.15s ease;
          }
          .pm-nav-item.is-active .pm-nav-label { color: #2563eb; font-weight: 700; }
          .pm-nav-item:not(.is-active) .pm-nav-arrow { opacity: 0; }
          .pm-nav-arrow {
            font-size: 11px;
            color: #2563eb;
            transition: opacity 0.15s ease;
          }

          /* ---------------- Employee card ---------------- */
          .pm-emp { padding: 2px 0; }
          .pm-emp-head {
            position: relative;
            text-align: center;
            padding: 24px 14px 16px;
            border-radius: 16px;
            background: var(--bg-pure-white);
            border: 1px solid var(--border-color);
            margin-bottom: 12px;
            overflow: hidden;
          }
          .pm-emp-avatar-wrap { position: relative; display: inline-block; margin-bottom: 10px; }
          .pm-emp-avatar {
            background: var(--bg-pure-white) !important;
            color: #2563eb !important;
            border: 3px solid var(--bg-pure-white) !important;
            box-shadow: 0 6px 18px rgba(15, 23, 42, 0.14) !important;
            font-weight: 800 !important;
            font-size: 22px !important;
          }
          .pm-emp-status {
            position: absolute;
            bottom: 3px; right: 3px;
            width: 14px; height: 14px;
            border-radius: 50%;
            background: #22c55e;
            border: 2.5px solid var(--bg-pure-white);
            box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.35);
          }
          .pm-emp-name {
            margin: 0 !important;
            color: var(--text-primary) !important;
            font-size: 16px !important;
            font-weight: 800 !important;
            letter-spacing: -0.01em;
          }
          .pm-emp-role {
            font-size: 11px;
            font-weight: 500;
            color: var(--text-secondary);
            margin-top: 2px;
          }
          .pm-emp-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 7px;
          }
          .pm-emp-tile {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 9px;
            border-radius: 10px;
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            overflow: hidden;
            transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
          }
          .pm-emp-tile:hover {
            border-color: #bfdbfe;
            box-shadow: 0 3px 10px rgba(15, 23, 42, 0.06);
            transform: translateY(-1px);
          }
          .pm-emp-tile-ic {
            width: 24px; height: 24px;
            flex-shrink: 0;
            border-radius: 7px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: rgba(37, 99, 235, 0.09);
            color: #2563eb;
            font-size: 11px;
          }
          .pm-emp-tile-txt { overflow: hidden; }
          .pm-emp-tile-label {
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: var(--text-secondary);
            line-height: 1;
          }
          .pm-emp-tile-val {
            font-size: 10.5px;
            font-weight: 600;
            color: var(--text-primary);
            margin-top: 3px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.1;
          }

          /* ---------------- Performance gauge ---------------- */
          .pm-gauge {
            text-align: center;
            padding: 16px 14px;
            margin-top: 14px;
            border-radius: 16px;
            background: var(--bg-pure-white);
            border: 1px solid var(--border-color);
            box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
          }
          .pm-gauge-label {
            font-size: 10px;
            font-weight: 700;
            color: var(--text-secondary);
            display: block;
            margin-bottom: 14px;
            letter-spacing: 0.1em;
            text-transform: uppercase;
          }
          .pm-gauge-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 4px;
            margin-top: 16px;
            padding-top: 13px;
            border-top: 1px dashed var(--border-color);
          }
          .pm-gauge-stat { text-align: center; }
          .pm-gauge-stat + .pm-gauge-stat { border-left: 1px solid var(--border-color); }
          .pm-gauge-stat-label {
            font-size: 8.5px;
            font-weight: 600;
            color: var(--text-secondary);
            display: block;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.03em;
          }
          .pm-gauge-stat-val { font-size: 14px; font-weight: 800; line-height: 1; }

          /* ---------------- Main ---------------- */
          .pm-main {
            flex: 1;
            min-width: 0;
            padding: 8px 24px 0;
            display: flex;
            flex-direction: column;
          }
          .pm-main-body {
            flex: 1;
            height: calc(100vh - 200px);
            overflow-y: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .pm-main-body::-webkit-scrollbar { display: none; }

          @media (max-width: 820px) {
            .pm-shell { flex-direction: column; margin: 0; }
            .pm-sidebar { width: 100%; height: auto; position: static; border-right: none; border-bottom: 1px solid var(--border-color); }
            .pm-main-body { height: auto; }
          }

          /* ---------------- Premium Tickets section ---------------- */
          .pt-wrap { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
          .pt-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
          .pt-head-left { display: flex; align-items: center; gap: 10px; }
          .pt-head-icon {
            width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
            display: inline-flex; align-items: center; justify-content: center;
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); color: #2563eb;
          }
          .pt-head-icon svg { width: 16px; height: 16px; }
          .pt-head-title { font-size: 14px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.01em; line-height: 1.2; }
          .pt-head-sub { font-size: 11.5px; color: var(--text-secondary); margin-top: 1px; }
          .pt-breakdown {
            display: inline-flex; align-items: center; gap: 7px; height: 32px; padding: 0 13px;
            border-radius: 9px; border: 1px solid var(--border-color); background: var(--bg-pure-white);
            color: var(--text-primary); font-size: 12px; font-weight: 600; cursor: pointer;
            transition: border-color .15s ease, color .15s ease, background .15s ease;
          }
          .pt-breakdown:hover { border-color: #93c5fd; color: #2563eb; background: #eff6ff; }
          .pt-breakdown .anticon { font-size: 13px; }
          .pt-head-actions { display: flex; align-items: center; gap: 10px; }
          .pt-score {
            display: inline-flex; align-items: center; gap: 8px; height: 32px; padding: 0 6px 0 12px;
            border-radius: 9px; border: 1px solid var(--border-color); background: var(--bg-secondary);
          }
          .pt-score-label { font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.04em; }
          .pt-score-val {
            display: inline-flex; align-items: center; justify-content: center; min-width: 30px; height: 22px; padding: 0 8px;
            border-radius: 6px; background: #2563eb; color: #fff; font-size: 13px; font-weight: 800; letter-spacing: -0.01em;
          }

          /* ---------- Distribution (segmented bar + legend) ---------- */
          .pt-dist {
            background: var(--bg-pure-white);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 12px 14px;
          }
          .pt-dist-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            margin-bottom: 11px;
            flex-wrap: wrap;
          }
          .pt-dist-total { display: flex; align-items: baseline; gap: 7px; }
          .pt-dist-total-num { font-size: 22px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.03em; line-height: 1; font-variant-numeric: tabular-nums; }
          .pt-dist-total-lbl { font-size: 10px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.06em; }
          .pt-dist-statuses { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
          .pt-dist-status { display: flex; align-items: center; gap: 6px; }
          .pt-dist-status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
          .pt-dist-status-val { font-size: 13px; font-weight: 800; color: var(--text-primary); line-height: 1; font-variant-numeric: tabular-nums; }
          .pt-dist-status-lbl { font-size: 11px; font-weight: 500; color: var(--text-secondary); }

          .pt-dist-bar {
            display: flex;
            gap: 2px;
            height: 8px;
            margin-bottom: 10px;
          }
          .pt-dist-seg {
            height: 100%;
            border-radius: 99px;
            min-width: 4px;
            transition: width .55s cubic-bezier(0.4,0,0.2,1), opacity .15s ease;
          }
          .pt-dist-seg:hover { opacity: 0.85; }
          .pt-dist-seg-empty { background: var(--bg-secondary); }

          .pt-dist-legend {
            display: flex;
            flex-wrap: wrap;
            gap: 7px 18px;
          }
          .pt-dist-leg { display: flex; align-items: center; gap: 6px; }
          .pt-dist-leg-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
          .pt-dist-leg-lbl { font-size: 11px; font-weight: 500; color: var(--text-secondary); }
          .pt-dist-leg-val { font-size: 12px; font-weight: 800; color: var(--text-primary); font-variant-numeric: tabular-nums; }
          .pt-dist-leg-pct { font-size: 10px; font-weight: 600; color: var(--text-secondary); }

          /* ---------------- Overview dashboard ---------------- */
          .ov { display: flex; flex-direction: column; gap: 10px; }

          .ov-hero {
            display: flex; align-items: stretch; gap: 18px;
            padding: 14px 18px;
            border-radius: 14px;
            border: 1px solid var(--border-color);
            background:
              radial-gradient(70% 110% at 0% 0%, rgba(37,99,235,0.06) 0%, transparent 52%),
              radial-gradient(70% 110% at 100% 0%, rgba(16,185,129,0.06) 0%, transparent 52%),
              var(--bg-pure-white);
          }
          .ov-hero-gauge { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 9px; flex-shrink: 0; padding-right: 18px; border-right: 1px solid var(--border-color); }
          .ov-hero-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 11px; }
          .ov-hero-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
          .ov-eyebrow { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-secondary); }
          .ov-hero-title { font-size: 28px; font-weight: 800; color: var(--text-primary); line-height: 1; letter-spacing: -0.03em; margin-top: 4px; font-variant-numeric: tabular-nums; }
          .ov-hero-title span { font-size: 14px; font-weight: 600; color: var(--text-secondary); margin-left: 2px; }
          .ov-hero-sub { font-size: 11px; color: var(--text-secondary); margin-top: 4px; font-weight: 500; }
          .ov-grade { display: inline-flex; align-items: center; height: 22px; padding: 0 11px; border-radius: 99px; font-size: 11px; font-weight: 800; }

          .ov-comp { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 9px 12px; border-radius: 10px; background: var(--bg-secondary); border: 1px solid var(--border-color); }
          .ov-comp-item { display: flex; flex-direction: column; gap: 2px; }
          .ov-comp-item span { font-size: 8.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-secondary); }
          .ov-comp-item b { font-size: 14px; font-weight: 800; color: var(--text-primary); font-variant-numeric: tabular-nums; line-height: 1; }
          .ov-comp-item.is-final b { color: #2563eb; }
          .ov-comp-op { font-size: 12px; font-weight: 700; color: var(--text-secondary); align-self: flex-end; padding-bottom: 1px; }

          .ov-subs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
          .ov-sub-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px; }
          .ov-sub-lbl { font-size: 10.5px; font-weight: 600; color: var(--text-secondary); }
          .ov-sub-val { font-size: 12px; font-weight: 800; color: var(--text-primary); font-variant-numeric: tabular-nums; }
          .ov-sub-bar { height: 5px; border-radius: 99px; background: var(--bg-secondary); overflow: hidden; }
          .ov-sub-fill { height: 100%; border-radius: 99px; transition: width .6s cubic-bezier(0.4,0,0.2,1); }

          .ov-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
          .ov-kpi {
            position: relative; overflow: hidden;
            padding: 12px 13px;
            border-radius: 12px;
            border: 1px solid var(--border-color);
            background: var(--bg-pure-white);
            transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
          }
          .ov-kpi:hover { transform: translateY(-2px); box-shadow: 0 8px 18px rgba(15,23,42,0.06); border-color: var(--ov-accent, var(--border-color)); }
          .ov-kpi-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
          .ov-kpi-ic { width: 28px; height: 28px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; }
          .ov-kpi-val { font-size: 21px; font-weight: 800; color: var(--text-primary); line-height: 1; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
          .ov-kpi-val small { font-size: 12px; font-weight: 700; color: var(--text-secondary); margin-left: 2px; }
          .ov-kpi-lbl { font-size: 10px; font-weight: 700; color: var(--text-secondary); margin-top: 5px; text-transform: uppercase; letter-spacing: 0.03em; }

          .ov-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .ov-card { padding: 13px 16px; border-radius: 12px; border: 1px solid var(--border-color); background: var(--bg-pure-white); }
          .ov-card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
          .ov-card-title { font-size: 12px; font-weight: 700; color: var(--text-primary); }
          .ov-card-meta { font-size: 10px; font-weight: 600; color: var(--text-secondary); background: var(--bg-secondary); border: 1px solid var(--border-color); padding: 2px 8px; border-radius: 99px; }

          .ov-donut-wrap { display: flex; align-items: center; gap: 16px; }
          .ov-donut { position: relative; width: 120px; height: 120px; flex-shrink: 0; }
          .ov-donut-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none; }
          .ov-donut-num { font-size: 22px; font-weight: 800; color: var(--text-primary); line-height: 1; font-variant-numeric: tabular-nums; }
          .ov-donut-lbl { font-size: 9px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 3px; }
          .ov-legend { flex: 1; display: flex; flex-direction: column; gap: 8px; min-width: 0; }
          .ov-leg { display: flex; align-items: center; gap: 8px; }
          .ov-leg-dot { width: 8px; height: 8px; border-radius: 3px; flex-shrink: 0; }
          .ov-leg-name { flex: 1; font-size: 11.5px; color: var(--text-secondary); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .ov-leg-val { font-size: 12px; font-weight: 800; color: var(--text-primary); font-variant-numeric: tabular-nums; }
          .ov-leg-pct { font-size: 10px; font-weight: 700; color: var(--text-secondary); min-width: 32px; text-align: right; }

          .ov-report { display: flex; flex-direction: column; gap: 12px; }
          .ov-rep-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px; }
          .ov-rep-lbl { font-size: 11.5px; font-weight: 600; color: var(--text-primary); }
          .ov-rep-val { font-size: 11px; font-weight: 700; color: var(--text-secondary); font-variant-numeric: tabular-nums; }
          .ov-rep-bar { height: 6px; border-radius: 99px; background: var(--bg-secondary); overflow: hidden; }
          .ov-rep-fill { height: 100%; border-radius: 99px; transition: width .6s cubic-bezier(0.4,0,0.2,1); }
          .ov-esc { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-secondary); }
          .ov-esc-ic { width: 32px; height: 32px; border-radius: 9px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
          .ov-esc-val { font-size: 16px; font-weight: 800; color: var(--text-primary); line-height: 1; }
          .ov-esc-lbl { font-size: 10.5px; color: var(--text-secondary); margin-top: 2px; }

          .ov-projects { display: flex; flex-direction: column; gap: 10px; }
          .ov-proj { display: flex; align-items: center; gap: 10px; }
          .ov-proj-badge { width: 27px; height: 27px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; flex-shrink: 0; }
          .ov-proj-name { font-size: 12px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .ov-proj-role { font-size: 10px; color: var(--text-secondary); margin-top: 1px; }
          .ov-proj-count { font-size: 11px; font-weight: 700; color: var(--text-secondary); white-space: nowrap; }

          @media (max-width: 1100px) {
            .ov-kpis { grid-template-columns: repeat(2, 1fr); }
            .ov-grid { grid-template-columns: 1fr; }
          }
          @media (max-width: 760px) {
            .ov-hero { flex-direction: column; gap: 14px; }
            .ov-hero-gauge { border-right: none; padding-right: 0; padding-bottom: 14px; border-bottom: 1px solid var(--border-color); }
            .ov-subs { grid-template-columns: 1fr; }
          }

          .pt-table-panel { background: var(--bg-pure-white); border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden; }
          .pt-table-head { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; border-bottom: 1px solid var(--border-color); }
          .pt-table-title { font-size: 13px; font-weight: 700; color: var(--text-primary); }
          .pt-table-count { font-size: 11px; font-weight: 600; color: var(--text-secondary); background: var(--bg-secondary); border: 1px solid var(--border-color); padding: 3px 10px; border-radius: 99px; }
          .pt-table .ant-table { background: transparent; }
          .pt-table .ant-table-thead > tr > th {
            background: var(--bg-secondary) !important; border-bottom: 1px solid var(--border-color) !important;
            font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.05em;
            text-transform: uppercase; color: var(--text-secondary) !important; padding: 7px 16px !important;
          }
          .pt-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-color) !important; padding: 7px 16px !important; }
          .pt-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
          .pt-table .ant-table-tbody > tr:hover > td { background: var(--bg-secondary) !important; }
          .pt-table .ant-table-cell { transition: background .12s ease; }
          .pt-tid {
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.5px; font-weight: 700;
            color: #2563eb; background: #eff6ff; border: 1px solid #dbeafe; padding: 3px 9px; border-radius: 7px; white-space: nowrap;
          }
          .pt-ttitle { font-size: 13px; font-weight: 600; color: var(--text-primary); }
          .pt-hours { font-size: 12.5px; font-weight: 700; }
          .pt-status {
            display: inline-flex; align-items: center; gap: 6px; height: 24px; padding: 0 10px;
            border-radius: 7px; font-size: 11px; font-weight: 700; white-space: nowrap;
          }
          .pt-status-dot { width: 6px; height: 6px; border-radius: 50%; }
          .pt-pill {
            display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700;
            padding: 4px 10px; border-radius: 7px; white-space: nowrap;
          }
          .pt-empty { display: flex; flex-direction: column; align-items: center; padding: 36px 20px; }
          .pt-empty-orb {
            width: 52px; height: 52px; border-radius: 15px; display: inline-flex; align-items: center; justify-content: center;
            background: var(--bg-secondary); color: #94a3b8; margin-bottom: 14px;
          }
          .pt-empty-title { font-size: 14px; font-weight: 700; color: var(--text-primary); }
          .pt-empty-sub { font-size: 12px; color: var(--text-secondary); margin-top: 4px; max-width: 320px; text-align: center; }

          @media (max-width: 820px) {
            .pt-dist-top { flex-direction: column; align-items: flex-start; gap: 14px; }
            .pt-dist-statuses { gap: 8px; }
          }
        `}} />
      </div>
    </MainLayout>
  );
}
