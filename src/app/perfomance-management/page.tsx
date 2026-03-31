
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
} from "@ant-design/icons";
import MainLayout from "@/components/layout/MainLayout";
import { MembersService } from "@/services/membersService";
import {
  AttendanceService,
  AttendanceSummary,
} from "@/services/attendanceService";
import { usePerformance } from "@/hooks/userPerformance";
import { usePositions } from "@/hooks/usePositions";
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
  Zap
} from "lucide-react";
import dayjs from "dayjs";

const { Option } = Select;
const { Text, Title } = Typography;

const StatCard = ({ label, value, icon: Icon, color, suffix }: any) => (
  <Card
    bodyStyle={{ padding: "16px 20px" }}
    style={{
      borderRadius: 12,
      border: "1px solid #f1f5f9",
      boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      height: "100%"
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <Text style={{ color: "#64748b", fontSize: 13, fontWeight: 500 }}>{label}</Text>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 4 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#1e293b" }}>{value}</div>
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
  const [selectedMonth, setSelectedMonth] = useState<string>("3");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [loadingPercent, setLoadingPercent] = useState<number>(0);

  // State for selected user's full details including position
  const [selectedUserDetails, setSelectedUserDetails] = useState<any>(null);

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
  const completionRate =
    ticketSummary.total > 0
      ? Math.round((ticketSummary.completed / ticketSummary.total) * 100)
      : 0;

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

  // Performance score - exclude attendance for future months
  const performanceScore =
    !isFutureMonth && appliedFilters.userId
      ? Math.round((completionRate + updateRate + attendanceRate) / 3)
      : Math.round((completionRate + updateRate) / 2);

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
        background: "#ffffff",
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
                <Title level={2} style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>Performance Management</Title>
                <Text style={{ color: "#64748b", fontSize: 15 }}>Comprehensive tracking of employee efficiency and engagement metrics.</Text>
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
              >
                {members.map((member) => (
                  <Option key={member.value} value={member.value}>
                    {member.label}
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

        <Divider style={{ margin: "0 0 20px 0", borderColor: "#f1f5f9" }} />



        {/* Main Content */}
        {!selectedMember ? (
          <div style={{
            height: "calc(100vh - 250px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#f8fafc",
            borderRadius: 24,
            border: "2px dashed #e2e8f0",
            margin: "0 10px",
            textAlign: "center",
            padding: "40px"
          }}>
            <div style={{
              width: 120,
              height: 120,
              background: "#ffffff",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
              marginBottom: 24,
              position: "relative",
              border: "1px solid #f1f5f9"
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
                border: "4px solid #ffffff",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
              }}>
                <Search size={14} color="white" strokeWidth={3} />
              </div>
            </div>
            <Title level={3} style={{ marginBottom: 8, color: "#0f172a", fontWeight: 700 }}>Select an Employee</Title>
            <Text style={{ color: "#64748b", fontSize: 16, maxWidth: 400, display: "block", marginBottom: 24 }}>
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
            background: "#ffffff",
            borderRadius: 24,
            border: "1px solid #f1f5f9",
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
            <Title level={4} style={{ marginBottom: 8, color: "#0f172a", fontWeight: 700 }}>Ready to Analyze</Title>
            <Text style={{ color: "#64748b", fontSize: 14, maxWidth: 320, display: "block", marginBottom: 24 }}>
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
            background: "#ffffff",
            borderRadius: 24,
            border: "1px solid #f1f5f9",
            margin: "0 10px",
            textAlign: "center",
            padding: "40px"
          }}>
            <div style={{ position: "relative", marginBottom: 32 }}>
              <Progress
                type="circle"
                percent={Math.round(loadingPercent)}
                width={180}
                strokeWidth={8}
                strokeColor={{
                  '0%': '#3b82f6',
                  '100%': '#10b981',
                }}
                format={(percent) => (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <span style={{ fontSize: 42, fontWeight: 900, color: "#1e293b", lineHeight: 1 }}>{percent}%</span>
                    <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Analyzing</span>
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
                          icon={<UserOutlined />}
                          style={{
                            backgroundColor: "#f8fafc",
                            color: "#3b82f6",
                            border: "1px solid #e2e8f0",
                          }}
                        />
                        <div style={{
                          position: "absolute",
                          bottom: 5,
                          right: 5,
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          background: "#22c55e",
                          border: "2px solid #ffffff"
                        }} />
                      </div>

                      <Title level={4} style={{ margin: "0 0 4px 0", color: "#0f172a", fontSize: 18, fontWeight: 800 }}>
                        {selectedUserDetails.label}
                      </Title>

                      {(() => {
                        const samplePos = positions[0] || {};
                        return (
                          <div style={{ marginBottom: 20 }}>
                            {/* <Text type="secondary" style={{ fontSize: 12, fontWeight: 500, color: "#64748b" }}>
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
                                      background: "#f8fafc",
                                      borderRadius: 10,
                                      border: "1px solid #f1f5f9",
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
                                        <Text strong style={{ fontSize: 8, color: "#94a3b8", display: "block", textTransform: "uppercase", letterSpacing: "0.05em", lineHeight: 1 }}>{item.label}</Text>
                                        <Tooltip title={item.value || "N/A"}>
                                          <Text strong style={{ fontSize: 10, color: "#1e293b", display: "block", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
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
                        <div style={{ textAlign: "left", paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                            <Text strong style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
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
                                      background: project.isAssigned ? `${color}10` : "#f8fafc",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      color: project.isAssigned ? color : "#94a3b8",
                                      fontSize: 10,
                                      fontWeight: 700,
                                      border: project.isAssigned ? "none" : "1px dashed #e2e8f0"
                                    }}>
                                      {project.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <Text strong style={{ fontSize: 12, color: project.isAssigned ? "#1e293b" : "#64748b", display: "block", lineHeight: 1 }}>{project.name}</Text>
                                      <Text type="secondary" style={{ fontSize: 10, display: "block", marginTop: 2 }}>{project.role || (project.isAssigned ? "Member" : "Contributor")}</Text>
                                    </div>
                                  </Space>
                                  <div style={{ fontSize: 11, fontWeight: 600, color: project.isAssigned ? "#94a3b8" : "#cbd5e1" }}>{count}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Performance Gauge Section (Inside same minimalist container) */}
                    <Divider style={{ margin: "20px 0", borderColor: "#f1f5f9" }} />

                    <div style={{ textAlign: "center" }}>
                      <Text strong style={{ fontSize: "10px", color: "#64748b", display: "block", marginBottom: 16, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                        Performance Gauge
                      </Text>

                      <Progress
                        type="circle"
                        percent={performanceScore}
                        width={110}
                        strokeWidth={8}
                        strokeColor={{
                          '0%': '#ef4444',
                          '100%': '#10b981',
                        }}
                        format={(percent) => (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <span style={{ fontSize: 24, fontWeight: 900, color: "#1e293b", lineHeight: 1 }}>{percent}%</span>
                            <span style={{ fontSize: 9, color: "#94a3b8", marginTop: 2, fontWeight: 700 }}>OVERALL</span>
                          </div>
                        )}
                      />

                      <div style={{ marginTop: 20, padding: "10px", background: "#f8fafc", borderRadius: 12, border: "1px solid #f1f5f9" }}>
                        <Row gutter={[4, 4]}>
                          <Col span={8}>
                            <div style={{ textAlign: "center" }}>
                              <Text type="secondary" style={{ fontSize: 9, display: "block", marginBottom: 2 }}>Tickets</Text>
                              <Text strong style={{ color: "#10b981", fontSize: 11 }}>{completionRate}%</Text>
                            </div>
                          </Col>
                          <Col span={8}>
                            <div style={{ textAlign: "center" }}>
                              <Text type="secondary" style={{ fontSize: 9, display: "block", marginBottom: 2 }}>Updates</Text>
                              <Text strong style={{ color: "#f59e0b", fontSize: 11 }}>{updateRate}%</Text>
                            </div>
                          </Col>
                          <Col span={8}>
                            <div style={{ textAlign: "center" }}>
                              <Text type="secondary" style={{ fontSize: 9, display: "block", marginBottom: 2 }}>Attendance</Text>
                              <Text strong style={{ color: "#3b82f6", fontSize: 11 }}>{attendanceRate}%</Text>
                            </div>
                          </Col>
                        </Row>
                      </div>
                    </div>
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
                    background: "#f8fafc",
                    borderRadius: 16,
                    border: "1px solid #f1f5f9",
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
                            <Text strong style={{ fontSize: 16, color: "#1e293b", lineHeight: 1.1 }}>{item.value}</Text>
                            {item.suffix && <Text type="secondary" style={{ fontSize: 10, fontWeight: 600 }}>{item.suffix}</Text>}
                          </div>
                        </div>
                        {idx < 3 && <Divider type="vertical" style={{ height: 24, margin: "0 12px", borderColor: "#e2e8f0" }} />}
                      </div>
                    ))}
                  </div>
                )}

                {selectedMember && (
                  /* Unified Ticket Performance Card */
                  <Card
                    size="small"
                    style={{ borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)", marginBottom: 24 }}
                    title={
                      <Space size={8}>
                        <div style={{ background: "#f0f9ff", padding: "6px", borderRadius: "8px", display: "flex" }}>
                          <Layers style={{ color: "#0ea5e9", width: 16, height: 16 }} />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Ticket Performance Details</span>
                      </Space>
                    }
                    extra={<Tag style={{ borderRadius: "4px", border: "none", background: "#f1f5f9", color: "#64748b" }}>Total: {ticketSummary.total}</Tag>}
                  >
                    <div style={{ padding: "12px 16px" }}>
                      <Row gutter={[10, 10]}>
                        {[
                          { label: "Completed", value: ticketSummary.completed, color: "#10b981", percent: completionRate, icon: <CheckCircleOutlined /> },
                          { label: "In Progress", value: ticketSummary.inProgress, color: "#f59e0b", percent: ticketSummary.total > 0 ? Math.round((ticketSummary.inProgress / ticketSummary.total) * 100) : 0, icon: <HistoryOutlined /> },
                          { label: "Pending", value: ticketSummary.pending, color: "#ef4444", percent: ticketSummary.total > 0 ? Math.round((ticketSummary.pending / ticketSummary.total) * 100) : 0, icon: <InfoCircleOutlined /> },
                          { label: "On Time", value: ticketSummary.onTime || 0, color: "#10b981", percent: ticketSummary.total > 0 ? Math.round((ticketSummary.onTime / ticketSummary.total) * 100) : 0, icon: <SafetyCertificateOutlined /> },
                          { label: "Delayed", value: ticketSummary.late || 0, color: "#ef4444", percent: ticketSummary.total > 0 ? Math.round((ticketSummary.late / ticketSummary.total) * 100) : 0, icon: <WarningOutlined /> },
                          { label: "Not Tracked", value: ticketSummary.untracked || 0, color: "#64748b", percent: ticketSummary.total > 0 ? Math.round((ticketSummary.untracked / ticketSummary.total) * 100) : 0, icon: <CloseSquareOutlined /> },
                        ].map((item, idx) => (
                          <Col key={idx} xs={24} sm={12} lg={8}>
                            <div style={{
                              background: "#f8fafc",
                              borderRadius: "12px",
                              padding: "14px",
                              border: "1px solid #f1f5f9",
                              height: "100%",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between"
                            }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                                <Space size={8}>
                                  <div style={{ color: item.color, display: "flex", fontSize: 16 }}>{item.icon}</div>
                                  <Text style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.025em" }}>{item.label}</Text>
                                </Space>
                                <Text style={{ fontSize: 24, fontWeight: 800, color: "#1e293b", lineHeight: 1 }}>{item.value}</Text>
                              </div>
                              <div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                  <Text style={{ fontSize: 10, color: "#94a3b8", fontWeight: 500 }}>{item.percent}% Ratio</Text>
                                </div>
                                <Progress
                                  percent={item.percent}
                                  size="small"
                                  showInfo={false}
                                  strokeColor={item.color}
                                  trailColor="#e2e8f0"
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
                          render: (hours: number) => <Text style={{ color: "#64748b" }}>{hours || 0}h</Text>
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
                    style={{ borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)" }}
                    title={
                      <Space size={8}>
                        <div style={{ background: "#f8fafc", padding: "6px", borderRadius: "8px", display: "flex" }}>
                          <FileTextOutlined style={{ color: "#64748b" }} />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Daily Updates Log</span>
                      </Space>
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
                              border: "1px solid #f0fdf4",
                              background: "#f0fdf4",
                              boxShadow: "none"
                            }}
                          >
                            <Statistic
                              title={<span style={{ fontSize: 12, fontWeight: 600, color: "#166534" }}>BOD COMPLIANCE</span>}
                              value={performanceData?.dailyUpdates?.summary?.bod || 0}
                              suffix={`/ ${performanceData?.dailyUpdates?.summary?.total || 0}`}
                              valueStyle={{ color: "#10b981", fontWeight: 800, fontSize: 24 }}
                            />
                            <div style={{ fontSize: 11, color: "#15803d", marginTop: 4 }}>Total Beginning of Day updates</div>
                          </Card>

                          <Card
                            size="small"
                            style={{
                              borderRadius: "12px",
                              border: "1px solid #fffbeb",
                              background: "#fffbeb",
                              boxShadow: "none"
                            }}
                          >
                            <Statistic
                              title={<span style={{ fontSize: 12, fontWeight: 600, color: "#92400e" }}>EOD COMPLIANCE</span>}
                              value={performanceData?.dailyUpdates?.summary?.eod || 0}
                              suffix={`/ ${performanceData?.dailyUpdates?.summary?.total || 0}`}
                              valueStyle={{ color: "#f59e0b", fontWeight: 800, fontSize: 24 }}
                            />
                            <div style={{ fontSize: 11, color: "#b45309", marginTop: 4 }}>Total End of Day updates</div>
                          </Card>

                          <div style={{ padding: "8px", background: "#f8fafc", borderRadius: "10px", border: "1px dashed #e2e8f0" }}>
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
              </div>
            </Col>
          </Row>
        )}

        <style dangerouslySetInnerHTML={{
          __html: `
          .header-select .ant-select-selector {
            border-radius: 10px !important;
            border-color: #e2e8f0 !important;
          }
          .header-select .ant-select-selection-placeholder {
            color: #94a3b8 !important;
          }
          .ant-table-thead > tr > th {
            background: #f8fafc !important;
            color: #64748b !important;
            font-weight: 600 !important;
            text-transform: uppercase !important;
            font-size: 11px !important;
            letter-spacing: 0.05em !important;
          }
          .ant-table-row:hover > td {
            background: #f8fafc !important;
          }
          .ant-card {
            box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05) !important;
          }
        `}} />
      </div>
    </MainLayout>
  );
}
