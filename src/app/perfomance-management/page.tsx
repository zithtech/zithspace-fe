
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
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import dayjs from "dayjs";

const { Option } = Select;
const { Title, Text } = Typography;

export default function PerformanceManagePage() {
  const [loading, setLoading] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>();
  const [selectedMonth, setSelectedMonth] = useState<string>("3");
  const [selectedYear, setSelectedYear] = useState<string>("2026");

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
    if (!appliedFilters.userId || !appliedFilters.month || !appliedFilters.year)
      return;

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
    if (selectedMember && selectedMonth && selectedYear) {
      setAppliedFilters({
        userId: selectedMember,
        month: selectedMonth,
        year: selectedYear,
      });
    }
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
  };

  const ticketDistribution = performanceData?.tickets?.distribution || [];

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
    Math.round((dailyUpdatesSummary.total / attendanceSummary.totalDays) * 100) || 0;

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
      <div style={{ padding: "24px", minHeight: "100vh", backgroundColor: "#ffffff" }}>
        {/* Sticky Header Section */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 100,
            // backgroundColor: "#ffffff",
            paddingTop: "16px",
            paddingBottom: "8px",
            marginBottom: 16,
            // borderBottom: "1px solid #f1f5f9",
          }}
        >
          {/* Header Text */}
          <div style={{ marginBottom: 16 }}>
            <Title level={4} style={{ margin: 0, fontWeight: 600, color: "#0f172a", letterSpacing: "-0.02em" }}>
              Performance Management
            </Title>
            <Text style={{ color: "#64748b", fontSize: "13px" }}>
              Comprehensive tracking of employee efficiency and engagement metrics
            </Text>
          </div>
          <Card
            size="small"
            style={{
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              position: "relative",
              overflow: "hidden",
              background: "#ffffff",
              boxShadow: "none",
            }}
          >
            {/* Removed gradient bar */}

            <Space wrap style={{ padding: "8px 4px" }} size={16}>
              <Select
                placeholder="Select Employee"
                style={{ width: 220 }}
                value={selectedMember}
                onChange={setSelectedMember}
                loading={loading}
                allowClear
                showSearch
              >
                {members.map((member) => (
                  <Option key={member.value} value={member.value}>
                    {member.label}
                  </Option>
                ))}
              </Select>

              <Select
                placeholder="Month"
                style={{ width: 130 }}
                value={selectedMonth}
                onChange={setSelectedMonth}
              >
                {months.map((month) => (
                  <Option key={month.value} value={month.value}>
                    {month.label}
                  </Option>
                ))}
              </Select>

              <Select
                placeholder="Year"
                style={{ width: 100 }}
                value={selectedYear}
                onChange={setSelectedYear}
              >
                {years.map((year) => (
                  <Option key={year} value={year}>
                    {year}
                  </Option>
                ))}
              </Select>

              <Button
                type="primary"
                size="large"
                icon={<FilterOutlined />}
                onClick={handleApply}
                disabled={!selectedMember || !selectedMonth || !selectedYear}
                loading={performanceLoading || attendanceLoading}
                style={{
                  borderRadius: "8px",
                  background: "#0f172a",
                  height: "40px",
                  padding: "0 20px",
                  fontWeight: 500,

                }}
              >
                Generate Report
              </Button>

              {selectedUserDetails && (
                <div
                  style={{
                    marginLeft: 8,
                    padding: "4px 12px",
                    background: "#f0f9ff",
                    borderRadius: "20px",
                    border: "1px solid #bae6fd",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <Avatar size={24} icon={<UserOutlined />} style={{ backgroundColor: "#f1f5f9", color: "#64748b" }} />
                  <Text strong style={{ color: "#334155", fontSize: "13px" }}>
                    {selectedUserDetails.label}
                  </Text>
                </div>
              )}
            </Space>
          </Card>
        </div>

        {/* Main Content */}
        <Spin
          spinning={
            performanceLoading ||
            loading ||
            attendanceLoading ||
            positionsLoading
          }
        >
          <Row gutter={[16, 16]}>
            {/* LEFT COLUMN - 70% - Scrollable with Hidden Scrollbar */}
            <Col
              xs={24}
              lg={17}
              style={{
                height: "calc(100vh - 200px)",
                overflowY: "scroll",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                paddingRight: "8px",
              }}
            >
              <style>
                {`
                  .left-scrollable::-webkit-scrollbar {
                    display: none;
                  }
                `}
              </style>

              <div className="left-scrollable">
                {/* Top 4 Cards Row */}
                {selectedMember && (
                  <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                    <Col xs={24} sm={12} lg={6}>
                      <Card
                        size="small"
                        style={{ borderRadius: "12px", border: "1px solid #e2e8f0", height: "100%", boxShadow: "none" }}
                        bodyStyle={{ padding: "16px" }}
                      >
                        <Statistic
                          title={<Text style={{ color: "#64748b", fontSize: "12px", fontWeight: 500 }}>Total Tickets</Text>}
                          value={ticketSummary.total}
                          valueStyle={{
                            fontSize: 24,
                            fontWeight: "700",
                            color: "#0ea5e9",
                          }}
                        />
                        <div style={{ marginTop: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <Text style={{ fontSize: "11px", color: "#94a3b8" }}>
                              Completed: {ticketSummary.completed}
                            </Text>
                            <Text style={{ fontSize: "11px", fontWeight: 600, color: "#10b981" }}>
                              {completionRate}%
                            </Text>
                          </div>
                          {/* <Progress
                            percent={completionRate}
                            size="small"
                            showInfo={false}
                            strokeColor="#10b981"
                            strokeWidth={6}
                          /> */}
                        </div>
                      </Card>
                    </Col>

                    <Col xs={24} sm={12} lg={6}>
                      <Card
                        size="small"
                        style={{ borderRadius: "12px", border: "1px solid #e2e8f0", height: "100%", boxShadow: "none" }}
                        bodyStyle={{ padding: "16px" }}
                      >
                        <Statistic
                          title={<Text style={{ color: "#64748b", fontSize: "12px", fontWeight: 500 }}>Attendance</Text>}
                          value={
                            !isFutureMonth && appliedFilters.userId
                              ? attendanceSummary.presentDays
                              : 0
                          }
                          suffix={<span style={{ fontSize: "14px", color: "#94a3b8" }}>/ {attendanceSummary.totalDays}</span>}
                          valueStyle={{
                            fontSize: 24,
                            fontWeight: "700",
                            color: "#0ea5e9", // Standardize to Sky Blue
                          }}
                        />
                        <div style={{ marginTop: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <Text style={{ fontSize: "11px", color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {!appliedFilters.userId
                                ? "Select employee"
                                : isFutureMonth
                                  ? "Future month"
                                  : `Present: ${presentOutOf} | Late: ${lateOutOf}`}
                            </Text>
                            <Text style={{ fontSize: "11px", fontWeight: 600, color: "#0ea5e9" }}>
                              {attendanceRate}%
                            </Text>
                          </div>
                          {/* <Progress
                            percent={attendanceRate}
                            size="small"
                            showInfo={false}
                            strokeColor="#0ea5e9"
                            strokeWidth={6}
                          /> */}
                        </div>
                      </Card>
                    </Col>

                    <Col xs={24} sm={12} lg={6}>
                      <Card
                        size="small"
                        style={{ borderRadius: "12px", border: "1px solid #e2e8f0", height: "100%", boxShadow: "none" }}
                        bodyStyle={{ padding: "16px" }}
                      >
                        <Statistic
                          title={<Text style={{ color: "#64748b", fontSize: "12px", fontWeight: 500 }}>Daily Updates</Text>}
                          value={dailyUpdatesSummary.total}
                          suffix={<span style={{ fontSize: "14px", color: "#94a3b8" }}>/ {attendanceSummary.totalDays}</span>}
                          valueStyle={{
                            fontSize: 24,
                            fontWeight: "700",
                            color: "#f59e0b",
                          }}
                        />
                        <div style={{ marginTop: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <Text style={{ fontSize: "11px", color: "#94a3b8" }}>
                              BOD: {dailyUpdatesSummary.bod} | EOD: {dailyUpdatesSummary.eod}
                            </Text>
                            <Text style={{ fontSize: "11px", fontWeight: 600, color: "#f59e0b" }}>
                              {updateRate}%
                            </Text>
                          </div>
                          {/* <Progress
                            percent={updateRate}
                            size="small"
                            showInfo={false}
                            strokeColor="#f59e0b"
                            strokeWidth={6}
                          /> */}
                        </div>
                      </Card>
                    </Col>

                    <Col xs={24} sm={12} lg={6}>
                      <Card
                        size="small"
                        style={{ borderRadius: "12px", border: "1px solid #e2e8f0", height: "100%", boxShadow: "none" }}
                        bodyStyle={{ padding: "16px" }}
                      >
                        <Statistic
                          title={<Text style={{ color: "#64748b", fontSize: "12px", fontWeight: 500 }}>Leaves/Permissions</Text>}
                          value={
                            !isFutureMonth && appliedFilters.userId
                              ? attendanceSummary.absentDays
                              : 0
                          }
                          suffix={<span style={{ fontSize: "14px", color: "#94a3b8" }}>/ {attendanceSummary.totalDays}</span>}
                          valueStyle={{
                            fontSize: 24,
                            fontWeight: "700",
                            color: "#ef4444", // Red instead of Rose
                          }}
                        />
                        <div style={{ marginTop: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <Text style={{ fontSize: "11px", color: "#94a3b8" }}>
                              {attendanceSummary.halfDays > 0 ? `Half: ${attendanceSummary.halfDays}` : "Full Month"}
                            </Text>
                            <Text style={{ fontSize: "11px", fontWeight: 600, color: "#ef4444" }}>
                              {Math.round((attendanceSummary.absentDays / attendanceSummary.totalDays) * 100) || 0}%
                            </Text>
                          </div>
                          {/* <Progress
                            percent={Math.round((attendanceSummary.absentDays / attendanceSummary.totalDays) * 100) || 0}
                            size="small"
                            showInfo={false}
                            strokeColor="#ef4444"
                            strokeWidth={6}
                          /> */}
                        </div>
                      </Card>
                    </Col>
                  </Row>
                )}

                {/* Tickets Overview */}
                <Card
                  size="small"
                  style={{ borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: 20, boxShadow: "none" }}
                  title={
                    <Space size={8}>
                      <div style={{ background: "#f1f5f9", padding: "6px", borderRadius: "8px", display: "flex" }}>
                        <TagOutlined style={{ color: "#64748b" }} />
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Tickets Overview</span>
                    </Space>
                  }
                  extra={<Tag style={{ borderRadius: "4px", border: "none", background: "#f1f5f9", color: "#64748b" }}>Total: {ticketSummary.total}</Tag>}
                >
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                        }}
                      >
                        {/* Completed */}
                        <div
                          style={{
                            background: "transparent",
                            padding: "16px",
                            borderRadius: 12,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            border: "1px solid #e2e8f0"
                          }}
                        >
                          <div>
                            <Text style={{ fontSize: 13, color: "#166534", fontWeight: 500 }}>
                              Completed
                            </Text>
                            <div
                              style={{
                                fontSize: 28,
                                fontWeight: "800",
                                color: "#10b981",
                              }}
                            >
                              {ticketSummary.completed}
                            </div>
                          </div>
                          <Progress
                            type="circle"
                            percent={completionRate}
                            width={54}
                            strokeColor="#10b981"
                            strokeWidth={10}
                            format={(percent) => <span style={{ fontSize: 10, fontWeight: 700 }}>{percent}%</span>}
                          />
                        </div>

                        {/* In Progress */}
                        <div
                          style={{
                            background: "transparent",
                            padding: "16px",
                            borderRadius: 12,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            border: "1px solid #e2e8f0"
                          }}
                        >
                          <div>
                            <Text style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>
                              In Progress
                            </Text>
                            <div
                              style={{
                                fontSize: 28,
                                fontWeight: "800",
                                color: "#f59e0b",
                              }}
                            >
                              {ticketSummary.inProgress}
                            </div>
                          </div>
                          <Progress
                            type="circle"
                            percent={
                              ticketSummary.total > 0
                                ? Math.round(
                                  (ticketSummary.inProgress /
                                    ticketSummary.total) *
                                  100,
                                )
                                : 0
                            }
                            width={54}
                            strokeColor="#f59e0b"
                            strokeWidth={10}
                            format={(percent) => <span style={{ fontSize: 10, fontWeight: 700 }}>{percent}%</span>}
                          />
                        </div>

                        {/* Pending */}
                        <div
                          style={{
                            background: "transparent",
                            padding: "16px",
                            borderRadius: 12,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            border: "1px solid #e2e8f0"
                          }}
                        >
                          <div>
                            <Text style={{ fontSize: 13, color: "#9f1239", fontWeight: 500 }}>
                              Pending
                            </Text>
                            <div
                              style={{
                                fontSize: 28,
                                fontWeight: "800",
                                color: "#ef4444",
                              }}
                            >
                              {ticketSummary.pending}
                            </div>
                          </div>
                          <Progress
                            type="circle"
                            percent={
                              ticketSummary.total > 0
                                ? Math.round(
                                  (ticketSummary.pending /
                                    ticketSummary.total) *
                                  100,
                                )
                                : 0
                            }
                            width={54}
                            strokeColor="#ef4444"
                            strokeWidth={10}
                            format={(percent) => <span style={{ fontSize: 10, fontWeight: 700 }}>{percent}%</span>}
                          />
                        </div>
                      </div>
                    </Col>

                    {/* Right Column - Donut Chart */}
                    <Col span={12}>
                      {ticketDistribution.length > 0 ? (
                        <div style={{ height: 220 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={ticketDistribution.filter(
                                  (item) => item.value > 0,
                                )} // Filter zero values
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={90}
                                startAngle={0} // Start at 0 degrees
                                endAngle={360}
                                paddingAngle={0}
                                dataKey="value"
                              >
                                {ticketDistribution
                                  .filter((item) => item.value > 0)
                                  .map((entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={entry.color}
                                    />
                                  ))}
                              </Pie>
                              {/* <Tooltip
                                formatter={(
                                  value: number,
                                  name: string,
                                  props: any,
                                ) => {
                                  const total = ticketDistribution.reduce(
                                    (sum, item) => sum + item.value,
                                    0,
                                  );
                                  const percentage =
                                    total > 0
                                      ? Math.round((value / total) * 100)
                                      : 0;
                                  return [`${value} (${percentage}%)`, name];
                                }}
                              /> */}
                              <Tooltip
                                formatter={(
                                  value: any,
                                  name: any,
                                  entry: any,
                                  index: any,
                                  payload: any,
                                ) => {
                                  // Safe defaults
                                  const safeValue = value || 0;
                                  const safeName = name || "";

                                  // Calculate total
                                  const total = ticketDistribution.reduce(
                                    (sum, item) => sum + (item.value || 0),
                                    0,
                                  );

                                  // Calculate percentage
                                  const percentage =
                                    total > 0 && safeValue > 0
                                      ? Math.round((safeValue / total) * 100)
                                      : 0;

                                  // Return as array of React nodes
                                  return [
                                    <span key="value">
                                      <b>{safeValue}</b> ({percentage}%)
                                    </span>,
                                    safeName,
                                  ];
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              gap: 20,
                              marginTop: 8,
                            }}
                          >
                            {/* Legend - Show all items even if zero */}
                            {ticketDistribution.map((item, index) => (
                              <div
                                key={index}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <div
                                  style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: "50%",
                                    backgroundColor: item.color,
                                  }}
                                />
                                <Text style={{ fontSize: 12 }}>
                                  {item.name}: {item.value}
                                </Text>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            height: 220,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text type="secondary">No data available</Text>
                        </div>
                      )}
                    </Col>
                  </Row>
                </Card>

                {/* Daily Updates Log */}
                {selectedMember && (
                  <Card
                    size="small"
                    style={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "none" }}
                    title={
                      <Space size={8}>
                        <div style={{ background: "#f1f5f9", padding: "6px", borderRadius: "8px", display: "flex" }}>
                          <FileTextOutlined style={{ color: "#64748b" }} />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Daily Updates Log</span>
                      </Space>
                    }
                    extra={
                      <Space size={8}>
                        <Tag style={{ borderRadius: "4px", border: "none", background: "#f1f5f9", color: "#64748b" }}>BOD: {dailyUpdatesSummary.bod}</Tag>
                        <Tag style={{ borderRadius: "4px", border: "none", background: "#fef3c7", color: "#92400e" }}>EOD: {dailyUpdatesSummary.eod}</Tag>
                      </Space>
                    }
                  >
                    <Table
                      columns={dailyUpdateColumns}
                      dataSource={existingUpdates}
                      rowKey="key"
                      pagination={{ pageSize: 5, size: "small" }}
                      size="small"
                      locale={{ emptyText: "No update logs found for this period" }}
                    />
                  </Card>
                )}
              </div>
            </Col>

            {/* RIGHT COLUMN - 30% - ALL CARDS VISIBLE WITHOUT SCROLL */}
            <Col xs={24} lg={7}>
              <div
                style={{
                  position: "sticky",
                  top: "140px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                {/* Profile Card */}
                {selectedUserDetails && (
                  <Card
                    size="small"
                    bodyStyle={{ padding: "12px" }}
                    style={{ borderRadius: "12px", border: "1px solid #e2e8f0", background: "#ffffff", boxShadow: "none" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <Avatar
                        size={36}
                        icon={<UserOutlined />}
                        style={{ backgroundColor: "#f1f5f9", color: "#64748b" }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text strong style={{ fontSize: "14px", color: "#0f172a", display: "block", lineHeight: 1.1 }}>
                          {selectedUserDetails.label}
                        </Text>
                        <Space size={4} style={{ marginTop: 4 }} wrap>
                          <Tag style={{ fontSize: "10px", margin: 0, padding: "0 6px", borderRadius: "4px", border: "none", background: "#f1f5f9", color: "#64748b" }}>Active</Tag>
                          {selectedUserDetails.position && (
                            <Tag style={{ fontSize: "10px", margin: 0, padding: "0 6px", borderRadius: "4px", border: "none", background: "#e0f2fe", color: "#0369a1" }}>
                              {selectedUserDetails.position}
                            </Tag>
                          )}
                        </Space>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Efficiency Metrics Card */}
                <Card
                  size="small"
                  title={<span style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Performance Summary</span>}
                  style={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "none" }}
                  headStyle={{ padding: "4px 12px", minHeight: "32px", borderBottom: "1px solid #f1f5f9" }}
                  bodyStyle={{ padding: "12px" }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                        <Text style={{ fontSize: "10px", color: "#64748b" }}>Ticket</Text>
                        <Text style={{ fontSize: "10px", fontWeight: 700 }}>{completionRate}%</Text>
                      </div>
                      <Progress percent={completionRate} size="small" showInfo={false} strokeWidth={3} strokeColor="#10b981" />
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                        <Text style={{ fontSize: "10px", color: "#64748b" }}>Attendance</Text>
                        <Text style={{ fontSize: "10px", fontWeight: 700 }}>{attendanceRate}%</Text>
                      </div>
                      <Progress percent={attendanceRate} size="small" showInfo={false} strokeWidth={3} strokeColor="#0ea5e9" />
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                        <Text style={{ fontSize: "10px", color: "#64748b" }}>Updates</Text>
                        <Text style={{ fontSize: "10px", fontWeight: 700 }}>{updateRate}%</Text>
                      </div>
                      <Progress percent={updateRate} size="small" showInfo={false} strokeWidth={3} strokeColor="#f59e0b" />
                    </div>

                    <Row gutter={4} style={{ marginTop: 2 }}>
                      <Col span={12}>
                        <div style={{ background: "#f0f9ff", padding: "4px 8px", borderRadius: "6px", textAlign: "center", border: "1px solid #e0f2fe" }}>
                          <Text style={{ fontSize: "9px", color: "#0ea5e9", display: "block", opacity: 0.7 }}>BOD</Text>
                          <Text style={{ fontSize: "12px", fontWeight: 700, color: "#5b21b6" }}>{dailyUpdatesSummary.bod}</Text>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ background: "#fff7ed", padding: "4px 8px", borderRadius: "6px", textAlign: "center", border: "1px solid #ffedd5" }}>
                          <Text style={{ fontSize: "9px", color: "#ea580c", display: "block", opacity: 0.7 }}>EOD</Text>
                          <Text style={{ fontSize: "12px", fontWeight: 700, color: "#9a3412" }}>{dailyUpdatesSummary.eod}</Text>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Card>

                {/* Compact Score Card */}
                <Card
                  size="small"
                  bodyStyle={{ padding: "12px" }}
                  style={{ borderRadius: "12px", border: "1px solid #e2e8f0", background: "#ffffff", boxShadow: "none" }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <Text style={{ fontSize: "10px", color: "#64748b", fontWeight: 600, lineHeight: 1 }}>Overall</Text>
                      <Text style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", margin: "4px 0", lineHeight: 1 }}>
                        {performanceScore}%
                      </Text>
                    </div>

                    <div style={{ borderLeft: "1px solid #e0f2fe", paddingLeft: 12, display: "flex", flexDirection: "column", gap: 2 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
                        <Text style={{ fontSize: "10px", color: "#475569" }}>{ticketSummary.completed} Done</Text>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#0ea5e9" }} />
                        <Text style={{ fontSize: "10px", color: "#475569" }}>{attendanceSummary.presentDays} Pres.</Text>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b" }} />
                        <Text style={{ fontSize: "10px", color: "#475569" }}>{dailyUpdatesSummary.total} Upd.</Text>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </Col>
          </Row>
        </Spin>
      </div>
    </MainLayout>
  );
}
