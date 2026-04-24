
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Select,
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
} from "@ant-design/icons";
import MainLayout from "@/components/layout/MainLayout";
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
  Bar,
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

const { Option } = Select;
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
        padding: "24px 32px",
        background: "var(--bg-pure-white)",
        minHeight: "calc(100vh - 64px)"
      }}>
        {/* Header Section */}
        <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <Space size={12} align="center">
              <div style={{
                background: "#eff6ff",
                padding: 10,
                borderRadius: 12,
                color: "#2563eb",
                display: "flex"
              }}>
                <TrendingUp size={24} />
              </div>
              <div>
                <Title level={2} style={{ margin: 0, fontWeight: 700, color: "var(--text-primary)" }}>Performance Management</Title>
                <Text style={{ color: "var(--text-secondary)", fontSize: 15 }}>Comprehensive tracking of employee efficiency and engagement metrics.</Text>
              </div>
            </Space>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <Select
                placeholder="Select Employee"
                style={{ width: 200, height: 44 }}
                value={selectedMember}
                onChange={setSelectedMember}
                loading={loading}
                allowClear
                showSearch
                className="header-select"
                optionFilterProp="label"
                filterOption={(input, option) =>
                  String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
              >
                {members.map((member) => (
                  <Option key={member.value} value={member.value} label={member.label}>
                    <Space>
                      <Avatar
                        size="small"
                        src={member.avatarUrl}
                        style={{ backgroundColor: "#2563eb", fontSize: 10 }}
                      >
                        {member.label?.charAt(0)}
                      </Avatar>
                      {member.label}
                    </Space>
                  </Option>
                ))}
              </Select>

              <Select
                placeholder="Month"
                style={{ width: 120, height: 44 }}
                value={selectedMonth}
                onChange={setSelectedMonth}
                className="header-select"
              >
                {months.map((month) => (
                  <Option key={month.value} value={month.value}>
                    {month.label}
                  </Option>
                ))}
              </Select>

              <Select
                placeholder="Year"
                style={{ width: 90, height: 44 }}
                value={selectedYear}
                onChange={setSelectedYear}
                className="header-select"
              >
                {years.map((year) => (
                  <Option key={year} value={year}>
                    {year}
                  </Option>
                ))}
              </Select>
            </div>

            <Button
              type="primary"
              size="large"
              icon={<Filter size={18} />}
              onClick={handleApply}
              disabled={!selectedMember || !selectedMonth || !selectedYear}
              loading={performanceLoading || attendanceLoading}
              style={{
                borderRadius: 10,
                height: 44,
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

        <Divider style={{ margin: "0 0 20px 0", borderColor: "var(--border-color)" }} />



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
          <Row gutter={[16, 16]}>
            {/* LEFT COLUMN - 25% - ALL CARDS VISIBLE WITHOUT SCROLL */}
            <Col xs={24} lg={6}>
              <div
                style={{
                  position: "sticky",
                  top: "0",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  paddingRight: "4px"
                }}
              >
                {/* Simplified Profile Section (No Card) */}
                {selectedUserDetails && (
                  <div style={{ padding: "8px 0" }}>
                    <div style={{ textAlign: "center", marginBottom: 16 }}>
                      <div style={{ position: "relative", display: "inline-block", marginBottom: 10 }}>
                        <Avatar
                          size={72}
                          src={selectedUserDetails.avatarUrl}
                          style={{
                            backgroundColor: "var(--bg-secondary)",
                            color: "#3b82f6",
                            border: "1px solid var(--border-color)",
                          }}
                        >
                          {selectedUserDetails.label?.charAt(0)}
                        </Avatar>
                        <div style={{
                          position: "absolute",
                          bottom: 5,
                          right: 5,
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          background: "#22c55e",
                          border: "2px solid var(--bg-pure-white)"
                        }} />
                      </div>

                      <Title level={4} style={{ margin: "0 0 4px 0", color: "var(--text-primary)", fontSize: 18, fontWeight: 800 }}>
                        {selectedUserDetails.label}
                      </Title>

                      {(() => {
                        const samplePos = positions[0] || {};
                        return (
                          <div style={{ marginBottom: 20 }}>
                            {/* <Text type="secondary" style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>
                              {samplePos.title || "Employee"}
                            </Text> */}

                            <div style={{ marginTop: 16 }}>
                              <Row gutter={[6, 6]}>
                                {[
                                  { label: "Grade", value: samplePos.gradeName, icon: <StarOutlined />, color: "#3b82f6" },
                                  { label: "Dept", value: samplePos.departmentName, icon: <BankOutlined />, color: "#8b5cf6" },
                                  { label: "Sub-Dept", value: samplePos.subDepartmentName, icon: <TeamOutlined />, color: "#f59e0b" },
                                  { label: "Position", value: samplePos.title, icon: <TagOutlined />, color: "#10b981" },
                                ].map((item, idx) => (
                                  <Col span={12} key={idx}>
                                    <div style={{
                                      padding: "8px 10px",
                                      background: "var(--bg-secondary)",
                                      borderRadius: 10,
                                      border: "1px solid var(--border-color)",
                                      textAlign: "left",
                                      height: "100%",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 8
                                    }}>
                                      <div style={{
                                        width: 20,
                                        height: 20,
                                        background: `${item.color}10`,
                                        borderRadius: 5,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: item.color,
                                        flexShrink: 0
                                      }}>
                                        {React.cloneElement(item.icon as any, { style: { fontSize: 11 } })}
                                      </div>
                                      <div style={{ overflow: "hidden" }}>
                                        <Text strong style={{ fontSize: 8, color: "var(--text-secondary)", display: "block", textTransform: "uppercase", letterSpacing: "0.05em", lineHeight: 1 }}>{item.label}</Text>
                                        <Tooltip title={item.value || "N/A"}>
                                          <Text strong style={{ fontSize: 10, color: "var(--text-primary)", display: "block", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {item.value || "N/A"}
                                          </Text>
                                        </Tooltip>
                                      </div>
                                    </div>
                                  </Col>
                                ))}
                              </Row>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Performance Gauge Section (Now at top of details) */}
                    <div style={{ textAlign: "center", paddingTop: 16, borderTop: "1px solid var(--border-color)" }}>
                      <Text strong style={{ fontSize: "10px", color: "var(--text-secondary)", display: "block", marginBottom: 16, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                        Performance Gauge
                      </Text>

                      <Progress
                        type="circle"
                        percent={performanceScore}
                        size={110}
                        strokeWidth={8}
                        strokeColor={{
                          '0%': '#ef4444',
                          '100%': '#10b981',
                        }}
                        format={(percent) => (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <span style={{ fontSize: 24, fontWeight: 900, color: "var(--text-primary)", lineHeight: 1 }}>{percent}%</span>
                            <span style={{ fontSize: 9, color: "var(--text-secondary)", marginTop: 2, fontWeight: 700 }}>OVERALL</span>
                          </div>
                        )}
                      />

                      <div style={{ marginTop: 20, padding: "10px", background: "var(--bg-secondary)", borderRadius: 12, border: "1px solid var(--border-color)" }}>
                        <Row gutter={[4, 4]}>
                          <Col span={8}>
                            <div style={{ textAlign: "center" }}>
                              <Text type="secondary" style={{ fontSize: 9, display: "block", marginBottom: 2 }}>Ticket Score</Text>
                              <Text strong style={{ color: "#10b981", fontSize: 11 }}>{ticketScore}</Text>
                            </div>
                          </Col>
                          <Col span={8}>
                            <div style={{ textAlign: "center" }}>
                              <Text type="secondary" style={{ fontSize: 9, display: "block", marginBottom: 2 }}>EOD Penalty</Text>
                              <Text strong style={{ color: "#f59e0b", fontSize: 11 }}>-{eodPenalty}</Text>
                            </div>
                          </Col>
                          <Col span={8}>
                            <div style={{ textAlign: "center" }}>
                              <Text type="secondary" style={{ fontSize: 9, display: "block", marginBottom: 2 }}>Escalation Penalty</Text>
                              <Text strong style={{ color: "#ef4444", fontSize: 11 }}>-{escalationPenalty}</Text>
                            </div>
                          </Col>
                        </Row>
                      </div>
                    </div>

                    <Divider style={{ margin: "20px 0", borderColor: "var(--border-color)" }} />

                    {/* Active Projects Section (Now below gauge) */}
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
            </Col>

            {/* RIGHT COLUMN - 75% - Scrollable with Hidden Scrollbar */}
            <Col
              xs={24}
              lg={18}
              style={{
                height: "calc(100vh - 200px)",
                overflowY: "scroll",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                paddingLeft: "8px",
              }}
            >
              <style>
                {`
                  .right-scrollable::-webkit-scrollbar {
                    display: none;
                  }
                `}
              </style>

              <div className="right-scrollable">
                {/* Compact Metrics Row */}
                {selectedMember && (
                  <div style={{
                    display: "flex",
                    gap: "16px",
                    marginBottom: 24,
                    padding: "12px 20px",
                    background: "var(--bg-secondary)",
                    borderRadius: 16,
                    border: "1px solid var(--border-color)",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    {[
                      { label: "Total Tickets", value: ticketSummary.total, icon: Layers, color: "#0ea5e9" },
                      { label: "Attendance", value: !isFutureMonth && appliedFilters.userId ? attendanceSummary.presentDays : 0, suffix: `/ ${attendanceSummary.totalDays}`, icon: Calendar, color: "#10b981" },
                      { label: "Daily Updates", value: dailyUpdatesSummary.total, suffix: `/ ${attendanceSummary.totalDays}`, icon: Activity, color: "#f59e0b" },
                      { label: "Completion", value: completionRate, suffix: "%", icon: TrendingUp, color: "#2563eb" },
                    ].map((item: any, idx: number) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          color: item.color,
                          background: `${item.color}15`,
                          padding: "8px",
                          borderRadius: "10px",
                          display: "flex"
                        }}>
                          <item.icon size={16} />
                        </div>
                        <div>
                          <Text type="secondary" style={{ fontSize: 10, display: "block", marginBottom: 2, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.025em" }}>
                            {item.label}
                          </Text>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                            <Text strong style={{ fontSize: 16, color: "var(--text-primary)", lineHeight: 1.1 }}>{item.value}</Text>
                            {item.suffix && <Text type="secondary" style={{ fontSize: 10, fontWeight: 600 }}>{item.suffix}</Text>}
                          </div>
                        </div>
                        {idx < 3 && <Divider type="vertical" style={{ height: 24, margin: "0 12px", borderColor: "var(--border-color)" }} />}
                      </div>
                    ))}
                  </div>
                )}

                {selectedMember && (
                  /* Unified Ticket Performance Card */
                  <Card
                    size="small"
                    // size="small"
                    style={{ borderRadius: "16px", border: "1px solid var(--border-color)", boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)", marginBottom: 24, background: 'var(--bg-pure-white)' }}
                    title={
                      <Space size={8}>
                        <div style={{ background: "var(--bg-secondary)", padding: "6px", borderRadius: "8px", display: "flex" }}>
                          <Layers style={{ color: "#0ea5e9", width: 16, height: 16 }} />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Ticket Performance Details</span>
                      </Space>
                    }
                    extra={
                      <Space>
                        <Button
                          type="primary"
                          size="small"
                          icon={<AreaChartOutlined />}
                          style={{ borderRadius: "6px", fontSize: "11px", fontWeight: 600 }}
                          onClick={() => setBreakdownVisible(true)}
                        >
                          Breakdown
                        </Button>
                        <Tag style={{ borderRadius: "4px", border: "none", background: "var(--border-color)", color: "var(--text-secondary)" }}>Total: {ticketSummary.total}</Tag>
                      </Space>
                    }
                  >
                    <div style={{ padding: "12px 16px" }}>
                      <Row gutter={[10, 10]}>
                        {[
                          { label: "Completed", value: ticketSummary.completed, color: "#10b981", percent: completionRate, icon: <CheckCircleOutlined /> },
                          { label: "In Progress", value: ticketSummary.inProgress, color: "#f59e0b", percent: ticketSummary.total > 0 ? Math.round((ticketSummary.inProgress / ticketSummary.total) * 100) : 0, icon: <HistoryOutlined /> },
                          { label: "Pending", value: ticketSummary.pending, color: "#ef4444", percent: ticketSummary.total > 0 ? Math.round((ticketSummary.pending / ticketSummary.total) * 100) : 0, icon: <InfoCircleOutlined /> },
                          { label: "On Time", value: ticketSummary.onTime || 0, color: "#10b981", percent: ticketSummary.total > 0 ? Math.round((ticketSummary.onTime / ticketSummary.total) * 100) : 0, icon: <SafetyCertificateOutlined /> },
                          { label: "Delayed", value: ticketSummary.late || 0, color: "#ef4444", percent: ticketSummary.total > 0 ? Math.round((ticketSummary.late / ticketSummary.total) * 100) : 0, icon: <WarningOutlined /> },
                          { label: "Not Tracked", value: ticketSummary.untracked || 0, color: "var(--text-secondary)", percent: ticketSummary.total > 0 ? Math.round((ticketSummary.untracked / ticketSummary.total) * 100) : 0, icon: <CloseSquareOutlined /> },
                        ].map((item, idx) => (
                          <Col key={idx} xs={24} sm={12} lg={8}>
                            <div style={{
                              background: "var(--bg-secondary)",
                              borderRadius: "12px",
                              padding: "14px",
                              border: "1px solid var(--border-color)",
                              height: "100%",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between"
                            }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                                <Space size={8}>
                                  <div style={{ color: item.color, display: "flex", fontSize: 16 }}>{item.icon}</div>
                                  <Text style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.025em" }}>{item.label}</Text>
                                </Space>
                                <Text style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>{item.value}</Text>
                              </div>
                              <div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                  <Text style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 500 }}>{item.percent}% Ratio</Text>
                                </div>
                                <Progress
                                  percent={item.percent}
                                  size="small"
                                  showInfo={false}
                                  strokeColor={item.color}
                                  trailColor="var(--border-color)"
                                  strokeWidth={4}
                                  style={{ margin: 0 }}
                                />
                              </div>
                            </div>
                          </Col>
                        ))}
                      </Row>
                    </div>

                    <Divider style={{ margin: "0" }} />
                    <Table
                      columns={[
                        {
                          title: "Ticket",
                          dataIndex: "ticketId",
                          key: "ticketId",
                          width: 120,
                          render: (text: string) => <Tag color="blue" style={{ borderRadius: 4, fontWeight: 600 }}>{text}</Tag>
                        },
                        {
                          title: "Title",
                          dataIndex: "title",
                          key: "title",
                          ellipsis: true,
                          render: (text: string) => <Text strong style={{ color: "#334155" }}>{text}</Text>
                        },
                        {
                          title: "Estimate",
                          dataIndex: "estimatedHours",
                          key: "estimatedHours",
                          width: 100,
                          align: "center",
                          render: (hours: number) => <Text style={{ color: "var(--text-secondary)" }}>{hours || 0}h</Text>
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
                            return <Text strong style={{ color: over ? "#ef4444" : "#10b981" }}>{timeStr}</Text>;
                          }
                        },
                        {
                          title: "Status",
                          dataIndex: "status",
                          key: "status",
                          width: 120,
                          render: (status: string) => {
                            const s = status?.toLowerCase();
                            let color = "default";
                            if (["completed", "done", "live"].includes(s)) color = "success";
                            if (["in progress", "in_progress", "in review"].includes(s)) color = "processing";
                            if (["pending", "todo", "open"].includes(s)) color = "warning";

                            // Format status name (e.g., in_progress -> In Progress)
                            const formattedStatus = status
                              ? status.split(/[_ ]/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
                              : status;

                            return <Tag color={color} style={{ borderRadius: 6 }}>{formattedStatus}</Tag>;
                          }
                        },
                        {
                          title: "Completion Status",
                          key: "completionStatus",
                          width: 150,
                          render: (_: any, record: any) => {
                            if (!record.timeSpent || record.timeSpent < 0.001 || !record.estimatedHours || record.estimatedHours < 0.001) {
                              return <Text type="secondary" style={{ fontSize: 11 }}>NO Tracked Time</Text>;
                            }
                            const over = record.timeSpent > record.estimatedHours;
                            if (!over) {
                              return <Tag color="success" style={{ borderRadius: 6, fontWeight: 600 }}>No Compliance</Tag>;
                            } else {
                              const extraHours = record.timeSpent - record.estimatedHours;
                              const h = Math.floor(extraHours);
                              const m = Math.round((extraHours - h) * 60);
                              const timeStr = h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}` : `${m}m`;
                              return <Text type="danger" strong style={{ fontSize: 12 }}>{timeStr} Late</Text>;
                            }
                          }
                        }
                      ]}
                      dataSource={performanceData?.tickets?.details || []}
                      rowKey="key"
                      pagination={{ pageSize: 5, size: "small" }}
                      size="middle"
                      locale={{ emptyText: "No ticket data available for this member in this period" }}
                    />
                  </Card>
                )}

                {selectedMember && (
                  <Card
                    size="small"
                    style={{ borderRadius: "16px", border: "1px solid var(--border-color)", boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)", background: 'var(--bg-pure-white)' }}
                    title={
                      <Space size={8}>
                        <div style={{ background: "var(--bg-secondary)", padding: "6px", borderRadius: "8px", display: "flex" }}>
                          <FileTextOutlined style={{ color: "var(--text-secondary)" }} />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Daily Updates Log</span>
                      </Space>
                    }
                    extra={
                      <Button
                        type="primary"
                        size="small"
                        icon={<AreaChartOutlined />}
                        style={{ borderRadius: "6px", fontSize: "11px", fontWeight: 600 }}
                        onClick={() => setDailyBreakdownVisible(true)}
                      >
                        Breakdown
                      </Button>
                    }
                  >
                    <Row gutter={24}>
                      {/* Left Side: Summary Cards (30%) */}
                      <Col xs={24} md={8}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <Card
                            size="small"
                            style={{
                              borderRadius: "12px",
                              border: "1px solid rgba(16, 185, 129, 0.2)",
                              background: "rgba(16, 185, 129, 0.05)",
                              boxShadow: "none"
                            }}
                          >
                            <Statistic
                              title={<span style={{ fontSize: 12, fontWeight: 600, color: "#10b981" }}>BOD COMPLIANCE</span>}
                              value={performanceData?.dailyUpdates?.summary?.bod || 0}
                              suffix={`/ ${performanceData?.dailyUpdates?.summary?.total || 0}`}
                              valueStyle={{ color: "#10b981", fontWeight: 800, fontSize: 24 }}
                            />
                            <div style={{ fontSize: 11, color: "#10b981", opacity: 0.8, marginTop: 4 }}>Total Beginning of Day updates</div>
                          </Card>

                          <Card
                            size="small"
                            style={{
                              borderRadius: "12px",
                              border: "1px solid rgba(245, 158, 11, 0.2)",
                              background: "rgba(245, 158, 11, 0.05)",
                              boxShadow: "none"
                            }}
                          >
                            <Statistic
                              title={<span style={{ fontSize: 12, fontWeight: 600, color: "#f59e0b" }}>EOD COMPLIANCE</span>}
                              value={performanceData?.dailyUpdates?.summary?.eod || 0}
                              suffix={`/ ${performanceData?.dailyUpdates?.summary?.total || 0}`}
                              valueStyle={{ color: "#f59e0b", fontWeight: 800, fontSize: 24 }}
                            />
                            <div style={{ fontSize: 11, color: "#f59e0b", opacity: 0.8, marginTop: 4 }}>Total End of Day updates</div>
                          </Card>

                          <div style={{ padding: "8px", background: "var(--bg-secondary)", borderRadius: "10px", border: "1px dashed var(--border-color)" }}>
                            <Text type="secondary" style={{ fontSize: 10 }}>
                              Showing missed updates for working days in the selected period.
                            </Text>
                          </div>
                        </div>
                      </Col>

                      {/* Right Side: Missed Updates Tabs (70%) */}
                      <Col xs={24} md={16}>
                        <Tabs
                          defaultActiveKey="bod"
                          size="small"
                          items={[
                            {
                              key: "bod",
                              label: `Missed BOD (${performanceData?.dailyUpdates?.missedBOD?.length || 0})`,
                              children: (
                                <Table
                                  columns={[
                                    {
                                      title: "Date",
                                      dataIndex: "date",
                                      key: "date",
                                      render: (d) => <Text strong>{dayjs(d).format("DD MMM (ddd)")}</Text>
                                    },
                                    {
                                      title: "Status",
                                      key: "status",
                                      render: () => <Tag color="error" style={{ borderRadius: 4 }}>Missed</Tag>
                                    }
                                  ]}
                                  dataSource={performanceData?.dailyUpdates?.missedBOD || []}
                                  rowKey="key"
                                  pagination={{ pageSize: 8, size: "small" }}
                                  size="small"
                                  locale={{ emptyText: "Perfect! No BOD updates missed." }}
                                />
                              )
                            },
                            {
                              key: "eod",
                              label: `Missed EOD (${performanceData?.dailyUpdates?.missedEOD?.length || 0})`,
                              children: (
                                <Table
                                  columns={[
                                    {
                                      title: "Date",
                                      dataIndex: "date",
                                      key: "date",
                                      render: (d) => <Text strong>{dayjs(d).format("DD MMM (ddd)")}</Text>
                                    },
                                    {
                                      title: "Status",
                                      key: "status",
                                      render: () => <Tag color="error" style={{ borderRadius: 4 }}>Missed</Tag>
                                    }
                                  ]}
                                  dataSource={performanceData?.dailyUpdates?.missedEOD || []}
                                  rowKey="key"
                                  pagination={{ pageSize: 8, size: "small" }}
                                  size="small"
                                  locale={{ emptyText: "Perfect! No EOD updates missed." }}
                                />
                              )
                            }
                          ]}
                        />
                      </Col>
                    </Row>
                  </Card>
                )}

                {selectedMember && (
                  <Card
                    size="small"
                    style={{ borderRadius: "16px", border: "1px solid var(--border-color)", boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)", marginTop: 24, background: 'var(--bg-pure-white)' }}
                    title={
                      <Space size={8}>
                        <div style={{ background: "rgba(225, 29, 72, 0.05)", padding: "6px", borderRadius: "8px", display: "flex" }}>
                          <AlertTriangle style={{ color: "#e11d48", width: 16, height: 16 }} />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Escalations Log</span>
                      </Space>
                    }
                    extra={
                      <Button
                        type="primary"
                        size="small"
                        danger
                        icon={<AreaChartOutlined />}
                        style={{ borderRadius: "6px", fontSize: "11px", fontWeight: 600 }}
                        onClick={() => setEscalationBreakdownVisible(true)}
                      >
                        Breakdown
                      </Button>
                    }
                  >
                    {!performanceData?.escalations?.details || performanceData?.escalations?.details.length === 0 ? (
                      <div style={{
                        padding: "40px 20px",
                        textAlign: "center",
                        background: "rgba(16, 185, 129, 0.05)",
                        borderRadius: "12px",
                        border: "1px dashed rgba(16, 185, 129, 0.3)",
                        margin: "12px"
                      }}>
                        <div style={{
                          width: 48,
                          height: 48,
                          background: "var(--bg-pure-white)",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto 16px",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)"
                        }}>
                          <CheckCircleOutlined style={{ color: "#10b981", fontSize: 24 }} />
                        </div>
                        <Title level={5} style={{ margin: "0 0 10px", color: "#10b981", fontWeight: 700 }}>Excellent Progress!</Title>
                        <Text style={{ color: "var(--text-secondary)" }}>No escalations have been recorded for <b>{selectedUserDetails?.label}</b> in this period. Keep up the great work.</Text>
                      </div>
                    ) : (
                      <Row gutter={24} style={{ padding: "12px" }}>
                        {/* Left Side: Consolidated Total Metric (30%) */}
                        <Col xs={24} md={7}>
                          <Card
                            size="small"
                            style={{
                              borderRadius: "16px",
                              border: "none",
                              background: "linear-gradient(135deg, #fff1f2 0%, #fff 100%)",
                              boxShadow: "0 4px 12px rgba(225, 29, 72, 0.08)",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: "24px 0"
                            }}
                            styles={{ body: { width: "100%", textAlign: "center" } }}
                          >
                            <div style={{
                              width: 56,
                              height: 56,
                              background: "#e11d48",
                              borderRadius: "16px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              margin: "0 auto 16px",
                              boxShadow: "0 8px 16px -4px rgba(225, 29, 72, 0.4)"
                            }}>
                              <AlertTriangle style={{ color: "#fff", width: 28, height: 28 }} />
                            </div>
                            <Text strong style={{ fontSize: 12, color: "#9f1239", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 4 }}>
                              Total Escalations
                            </Text>
                            <Title level={1} style={{ margin: 0, color: "#e11d48", fontWeight: 900, fontSize: 48, lineHeight: 1 }}>
                              {performanceData?.escalations?.summary?.total || 0}
                            </Title>

                          </Card>
                        </Col>

                        {/* Right Side: Enhanced Escalation Table (70%) */}
                        <Col xs={24} md={17}>
                          <Table
                            className="premium-table"
                            columns={[
                              {
                                title: "ISSUE DETAILS",
                                dataIndex: "subject",
                                key: "subject",
                                ellipsis: true,
                                render: (text: string, record: any) => (
                                  <Space direction="vertical" size={0}>
                                    <Text strong style={{ color: "var(--text-primary)", fontSize: 13 }}>{text}</Text>
                                    <Text type="secondary" style={{ fontSize: 11 }}>{record.category || 'General Issue'}</Text>
                                  </Space>
                                )
                              },
                              {
                                title: "PRIORITY",
                                dataIndex: "priority",
                                key: "priority",
                                width: 110,
                                align: 'center',
                                render: (priority) => {
                                  let color = "var(--text-secondary)";
                                  let bg = "var(--border-color)";
                                  if (priority === "HIGH" || priority === "URGENT") { color = "#e11d48"; bg = "#fff1f2"; }
                                  if (priority === "MEDIUM") { color = "#d97706"; bg = "#fffbeb"; }
                                  return (
                                    <div style={{
                                      color: color,
                                      background: bg,
                                      padding: "4px 10px",
                                      borderRadius: "6px",
                                      fontSize: 11,
                                      fontWeight: 800,
                                      display: "inline-block",
                                      letterSpacing: "0.02em"
                                    }}>
                                      {priority}
                                    </div>
                                  );
                                }
                              },
                              {
                                title: "STATUS",
                                dataIndex: "status",
                                key: "status",
                                width: 120,
                                align: 'right',
                                render: (status) => {
                                  const config: any = {
                                    OPEN: { color: "var(--color-error)", label: "ACTIVE", dot: "var(--color-error)" },
                                    IN_PROGRESS: { color: "var(--color-info)", label: "PROGRESS", dot: "var(--color-info)" },
                                    RESOLVED: { color: "var(--color-success)", label: "RESOLVED", dot: "var(--color-success)" },
                                    CLOSED: { color: "var(--color-success)", label: "CLOSED", dot: "var(--color-success)" }
                                  };
                                  const s = config[status] || { color: "var(--text-secondary)", label: status, dot: "var(--text-secondary)" };
                                  return (
                                    <Space size={6}>
                                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot }} />
                                      <Text strong style={{ fontSize: 11, color: s.color }}>{s.label}</Text>
                                    </Space>
                                  );
                                }
                              }
                            ]}
                            dataSource={performanceData?.escalations?.details || []}
                            rowKey="id"
                            pagination={{ pageSize: 5, size: "small" }}
                            size="small"
                            onRow={(record) => ({
                              onClick: () => handleRowClick(record),
                              style: { cursor: 'pointer' }
                            })}
                          />
                        </Col>
                      </Row>
                    )}
                  </Card>
                )}
              </div>
            </Col>
          </Row>
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
        `}} />
      </div>
    </MainLayout>
  );
}
